import fetch from "node-fetch";
import parse, { HTMLElement } from "node-html-parser";
import { URLSearchParams } from "url";
import { ScheduleWeek, ScheduleWeekData } from 'types/schedule';
interface HorbIntranetFacade {
    getStundenplan(kurs: string, day: number): Promise<ScheduleWeekData>;
}

class IntranetFacade implements HorbIntranetFacade {

    username: string;
    password: string;
    sessid: string;
    typoid: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
        this.sessid = "";
        this.typoid = "";
    }

    async logIn(): Promise<boolean> {

        // Might already be logged in
        if (this.sessid !== "" && this.typoid !== "") {

            let url = 'https://www.hb.dhbw-stuttgart.de/2067.html';
            let options: any = {
                method: 'GET',
                headers: { Accept: '*/*' },
                'Cookie': `PHPSESSID=${this.sessid}; fe_typo_user=${this.typoid}`
            }
            // First request to get the session-id
            const response = await fetch(url, options).catch(err => console.error('error:' + err));
            if (!response) throw new Error("Intranet response is null, maybe down?");
            
            // Check if the session is still valid, currently by checking if the string Benutzeranmeldung is in the response
            const text = await response.text();
            if (text.includes("Benutzeranmeldung")) {
                // Session is invalid
                this.sessid = "";
                this.typoid = "";
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
        encodedParams.set('pid', '404');
        encodedParams.set('referer', 'https://www.hb.dhbw-stuttgart.de/intranet.html');


        const url = 'https://www.hb.dhbw-stuttgart.de/intranet.html';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                "User-Agent": "Discord", // User-Agent is obligated, the value doesn't matter
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate, br",

                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            body: encodedParams.toString()
        };
        
        
        // Get the reponse for the typouserresponse.
        let loginresponse = await fetch(url, options);
        const cookies = loginresponse.headers.get('set-cookie')?.split(';');

        if(cookies){
            this.sessid = cookies[0].split('=')[1] || "";
            this.typoid = cookies[1].split('=')[2] || "";
        }
        return this.typoid !== "" && this.sessid !== "";
    }

    /**
     * 
     * @param kurs The course to get the schedule for
     * @param day offset from today, 0 = today, 1 = tomorrow, -1 = yesterday, etc.
     * @returns Promise<ScheduleWeekData>
     */
    async getStundenplan(kurs: string, day: number = 0): Promise<ScheduleWeekData> {
        const loggedIn = await this.logIn().catch(err => console.error("Login in getStundenplan failed:", err));
        if (!loggedIn) {
            throw new Error("Not successfully logged in, Intranet may be down, or bad credentials");
        }

        const date = new Date();
        date.setTime(date.getTime() + (day * 24 * 60 * 60 * 1000));

        let url = `https://www.hb.dhbw-stuttgart.de/2067.html?kurs=${kurs}&goto=Kurs+anzeigen&day=${date.getDate()}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;

        let options: any = {
            method: 'GET',
            headers: {
                "User-Agent": "Discord", // User-Agent is important, the value doesn't matter
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                'Cookie': `PHPSESSID=${this.sessid}; fe_typo_user=${this.typoid}`
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

        // appointments are all the divs with information about the lecture. Itself doesnt contain information about the weekday.
        let appointments: HTMLElement[] = table.querySelectorAll(".week_block");
        for (let appointment of appointments) {
            let time = appointment.querySelector(".time")?.text;
            let from = time?.split("-")[0].trim();
            let to = time?.split("-")[1].trim();
            let name = appointment.querySelector(".name")?.text;
            let person = appointment.querySelector(".person")?.text;
            let room = appointment.querySelectorAll(".resource")[0]?.text;
            let course = appointment.querySelectorAll(".resource")[1]?.text;
            let temp = appointment.previousElementSibling;
            let i = 1;

            // FIXME: This is a very bad way to get the weekday, but I couldn't find a better way right now. Currently it measures the nTh Child of a Table-Row and with the spans it can be determined which weekday it is. Which doesnt work right now. Fix: Save the spans and use it to show multicolumn in the png at the end.
            do {
                // if(temp.rawTagName === "tr") i++;
                if(temp?.rawTagName === "th"){
                    break;
                }
                temp = temp.previousElementSibling;
                i++;
            } while (temp !== null)

            let j = 0;
            let savei = i;
            for (let span of spans) {
                if (i < span) break;
                i -= span;
                j++;
            }
            let day = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag"][j] as 'montag' | 'dienstag' | 'mittwoch' | 'donnerstag' | 'freitag';
            if (!data[day]) data[day] = [];

            data[day]?.push(
                {
                    moduleName: name || "",
                    from: from || "",
                    to: to || "",
                    room: room || "",
                    person: person || "",
                    course: course || ""
                });
        }

        return { meta: { kw, year: date.getFullYear(), spans }, schedule: data };
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
