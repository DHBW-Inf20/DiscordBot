import fetch from "node-fetch";
import parse, { HTMLElement } from "node-html-parser";
import { URLSearchParams } from "url";
import { Schedule, ScheduleWeek, ScheduleWeekData, wochentag } from 'types/schedule';
interface HorbIntranetFacade {
    getStundenplan(kurs: string, day: number): Promise<ScheduleWeekData>;
}

class IntranetFacade implements HorbIntranetFacade {

    username: string;
    password: string;
    typouser: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
        this.typouser = "";
    }

    async logIn(): Promise<boolean> {

        // Might already be logged in
        if (this.typouser !== "") {

            let url = 'https://www.hb.dhbw-stuttgart.de/intranet';
            let options: any = {
                method: 'GET',
                headers: { Accept: '*/*' },
                'Cookie': `fe_typo_user=${this.typouser}`
            }
            // First request to get the session-id
            const response = await fetch(url, options).catch(err => console.error('error:' + err));
            if (!response) throw new Error("Intranet response is null, maybe down?");
            
            // Check if the session is still valid, currently by checking if the string Benutzeranmeldung is in the response
            const text = await response.text();
            if (text.includes("Benutzeranmeldung")) {
                // Session is invalid
                this.typouser = "";
            } else {
                // Session is valid
                return true;
            }
        }
        // URL-Search params for the login request
        const encodedParams = new URLSearchParams();
        encodedParams.set('user', `${this.username}`);
        encodedParams.set('pass', `${this.password}`);
        encodedParams.set('logintype', 'login');

        const url = 'https://www.hb.dhbw-stuttgart.de/intranet';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                "User-Agent": "Discord", // User-Agent is obligated, the value doesn't matter
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet",
                "Accept-Encoding": "gzip, deflate, br",

                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            body: encodedParams.toString()
        };
        
        
        // Get the reponse for the typouserresponse.
        let loginresponse = await fetch(url, options);
        // console.log(await loginresponse.text());
        const cookies = loginresponse.headers.get('set-cookie')?.split(';');

        if(cookies){
            this.typouser = cookies[0].split('=')[1] || "";
        }
        return this.typouser !== "";
    }

    /**
     * 
     * @param kurs The course to get the schedule for
     * @param week offset from today, 0 = today, 1 = tomorrow, -1 = yesterday, etc.
     * @returns Promise<ScheduleWeekData>
     */
    async getStundenplan(kurs: string, week: number = 0): Promise<ScheduleWeekData> {
        const loggedIn = await this.logIn().catch(err => console.error("Login in getStundenplan failed:", err));
        if (!loggedIn) {
            throw new Error("Not successfully logged in, Intranet may be down, or bad credentials");
        }

        const date = new Date();
        date.setTime(date.getTime() + (week * 7 * 24 * 60 * 60 * 1000));

        let url = `https://www.hb.dhbw-stuttgart.de/intranet/digitaler-stundenplan?kurs=${kurs}&goto=Kurs+anzeigen&day=${date.getDate()}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;
        let options: any = {
            method: 'GET',
            headers: {
                "User-Agent": "Discord", // User-Agent is important, the value doesn't matter
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                'Cookie': `fe_typo_user=${this.typouser}`
            }
        };

        let html = await fetch(url, options).then(res => res.text());

        let data: ScheduleWeek = {};
        let parsedHtml = parse(html);

        let table = parsedHtml.querySelector(".week_table");
        if (!(table)) throw new Error("Table could not be found on Intranet at getStundeplan");

        // First row to get the spans and Calendar-Week vals
        let firstRow = table?.querySelector("tr");
        let kw = parseInt(firstRow?.querySelector("th")?.text.split(" ")[1] || "0");
        let firstRowCells = firstRow?.querySelectorAll("td");

        // The Schedule is displayed with a table and if there are paralell lectures they are displayed in the same "column" and they have a colspan. This Information is needed to look which weekday the lecture is on.
        const spans: number[] = []
        for (let cell of firstRowCells || []) {
            spans.push(parseInt(cell.attributes.colspan));
        }

        // Time of first week in the format Mo 08.05.23
        let firstWeekDayText = table.querySelector(".week_header")?.text
        if (!firstWeekDayText) throw new Error("Could not find firstWeekDayText");
        firstWeekDayText = firstWeekDayText.split(" ")[1];
        let firstWeekDay = new Date();
        firstWeekDay.setFullYear(parseInt(firstWeekDayText.split(".")[2]));
        firstWeekDay.setMonth(parseInt(firstWeekDayText.split(".")[1]) - 1);
        firstWeekDay.setDate(parseInt(firstWeekDayText.split(".")[0]));

        // appointments are all the divs with information about the lecture. Itself doesnt contain information about the weekday.
        let appointments: HTMLElement[] = table.querySelectorAll(".week_block");
        for (let appointment of appointments) {
            let time = appointment.querySelector(".time")?.text;
            let backgroundCol = appointment.attributes.style.split(":")[1];
            let type : Schedule["type"] = 'lecture';
            if (backgroundCol == "#f79f81"){
                type = 'exam';
            }   
            let from = time?.split("-")[0].trim();

            let to = time?.split("-")[1].trim();
            let name = appointment.querySelector(".name")?.text;
            let person = appointment.querySelector(".person")?.text;
            let room = appointment.querySelectorAll(".resource")[0]?.text;
            let course = appointment.querySelectorAll(".resource")[1]?.text;
            let temp = appointment.previousElementSibling; // Das muss ein small_separator sein
            let i = 0.0; // Laufvariable die mitzählt in welcher Spalte der Termin ist diese Variable liest die anzahl an Spalten die die Klasse (small_)separatorcell hat (+0.5), somit hat man am ende den Index für den richtigen Wochentag.
            let visitedBigSeparator = false; // Flag ob schon ein großer Separator gefunden wurde, wenn nein, dann darf die die laufvar nicht hochgezählt werden, da es mehrere Termine gleichzeitig gibt, falls diese flag auf false sitzt werden alle week_blocks gezählt um die spalte in der woche zu finden.

            let lastSmallSeparator = false;

            let col = 0; // Zählt die spalte der Woche. Jede Spalte nimmt 2 Colspans ein.

            // FIXME: This is a very bad way to get the weekday, but I couldn't find a better way right now. Currently it measures the nTh Child of a Table-Row and with the spans it can be determined which weekday it is. Which doesnt work right now. Fix: Save the spans and use it to show multicolumn in the png at the end.
            while (temp !== null) {
                if (temp?.rawTagName === "th") { // Skip table header
                    break;
                }
                let className = temp?.attributes.class;
                switch(className){
                    case "week_smallseparatorcell":
                    case "week_smallseparatorcell_black":
                        if(visitedBigSeparator){
                            i += 0.5;
                        }else if(lastSmallSeparator){
                            col++;
                        }
                        lastSmallSeparator = true;
                        break;
                    case "week_separatorcell_black":
                    case "week_separatorcell":
                        visitedBigSeparator = true;
                        lastSmallSeparator = false;

                        i+=0.5;
                        break;
                    case "week_block":
                        lastSmallSeparator = false;
                        if(!visitedBigSeparator){
                            col++;
                        }
                        break;
                }



                temp = temp.previousElementSibling;
            } 

            let appointmentDay = table.querySelectorAll(".week_header")[i]?.text
            if (!appointmentDay) throw new Error("Could not find firstWeekDayText");
            appointmentDay = appointmentDay.split(" ")[1];
            let firstWeekDay = new Date();
            firstWeekDay.setFullYear(parseInt(appointmentDay.split(".")[2]));
            firstWeekDay.setMonth(parseInt(appointmentDay.split(".")[1]) - 1);
            firstWeekDay.setDate(parseInt(appointmentDay.split(".")[0]));

            let fromTimestamp = new Date(firstWeekDay);
            fromTimestamp.setHours(parseInt(from?.split(":")[0] || "0"));
            fromTimestamp.setMinutes(parseInt(from?.split(":")[1] || "0"));

            let toTimestamp = new Date(firstWeekDay);
            toTimestamp.setHours(parseInt(to?.split(":")[0] || "0"));
            toTimestamp.setMinutes(parseInt(to?.split(":")[1] || "0"));

            let day = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag"][i] as 'montag' | 'dienstag' | 'mittwoch' | 'donnerstag' | 'freitag';
            if (!data[day]) data[day] = [];

            data[day]?.push(
                {
                    moduleName: name || "",
                    from: from || "",
                    timestamp_from: fromTimestamp,
                    to: to || "",
                    timestamp_to: toTimestamp,
                    room: room || "",
                    person: person || "",
                    course: course || "",
                    col, type
                });
        }


        return { meta: { kw, year: date.getFullYear(), spans }, schedule: data };
    }

    async getCompleteSchedData(kurs: string){

        // Calculate how many weeks in the past January first 2021 was
        const janFirst = new Date(2021, 0, 1);
        const today = new Date();
        const week = 1000 * 60 * 60 * 24 * 7;
        const weeksSinceJanFirst = Math.floor((today.getTime() - janFirst.getTime()) / week);
        let allAppointments: Schedule[] = [];
        for(let weekOffset = weeksSinceJanFirst; weekOffset >= 0; weekOffset--){
            let data = await this.getStundenplan(kurs, -weekOffset);
            let sched = Object.values(data.schedule).flat();
            allAppointments = allAppointments.concat(sched);
        }

        return allAppointments;

    }

    
    
}

let intranet: IntranetFacade;
export const Intranet = {

    setInstance: (username: string, password: string) => {
        intranet = new IntranetFacade(username, password);
    },
    getInstance: () => {
        if (!intranet) throw new Error("Intranet not set");
        return intranet;
    }
}
