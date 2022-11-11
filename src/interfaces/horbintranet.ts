import fetch from "node-fetch";
import parse, { HTMLElement } from "node-html-parser";
import NodeRSA from "node-rsa";
import { exit } from "process";
import { URLSearchParams } from "url";
import { ScheduleWeek, ScheduleWeekData } from 'types/dualis';
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

        let url = 'https://www.hb.dhbw-stuttgart.de/index.php?eID=FrontendLoginRsaPublicKey';

        let options: any = {
            method: 'GET',
            headers: { Accept: '*/*' }
        };


        const response = await fetch(url, options).catch(err => console.error('error:' + err));
        if (!response) throw new Error("Response is null");
        const sessid = response.headers.get('set-cookie')?.split(';')[0].split('=')[1];
        this.sessid = sessid || "";
        const encodedParams = new URLSearchParams();
        encodedParams.set('user', `${this.username}`);
        encodedParams.set('pass', `${this.password}`);
        encodedParams.set('logintype', 'login');
        encodedParams.set('pid', '404');
        encodedParams.set('referer', 'https://www.hb.dhbw-stuttgart.de/intranet.html');
        url = 'https://www.hb.dhbw-stuttgart.de/intranet.html';
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',                
                'Cookie': `PHPSESSID=${this.sessid}`,
                'Accept': '*/*',
                "User-Agent": "Discord",
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            body: encodedParams.toString()
        };
        // (options)
        let typouserresponse = await fetch(url, options);
        console.log(typouserresponse.status, typouserresponse.statusText);
        // (await typouserresponse.text());
        this.typoid = typouserresponse.headers.get('set-cookie')?.split(';')[0].split('=')[1] || "";
        if(this.typoid === "") throw new Error("Typoid is empty");
        return true;
    }

    async getStundenplan(kurs: string, day: number = 0): Promise<ScheduleWeekData> {
        if (!await this.logIn()) throw new Error("Login failed");
        // get date with day offset
        const date = new Date();
        date.setTime(date.getTime() + (day * 24 * 60 * 60 * 1000));
        console.log(this.typoid, this.sessid);
        let url = `https://www.hb.dhbw-stuttgart.de/2067.html?kurs=${kurs}&goto=Kurs+anzeigen&day=${date.getDate()}&month=${date.getMonth() + 1}&year=${date.getFullYear()}`;
        console.log(url);
        let options: any = {
            method: 'GET',
            headers: {
                "User-Agent": "Discord",
                "Connection": "keep-alive",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                'Cookie': `PHPSESSID=${this.sessid}; fe_typo_user=${this.typoid}`
            }
        };
        let html = await fetch(url, options).then(res => res.text());
        // parse html in dom
        let data:ScheduleWeek = {};
        let parsedHtml = parse(html);
        let table = parsedHtml.querySelector(".week_table");
        let firstRow = table?.querySelector("tr");
        let kw = parseInt(firstRow?.querySelector("th")?.text.split(" ")[1] || "0");
        let firstRowCells = firstRow?.querySelectorAll("td");
        const spans:number[] = []
        for(let cell of firstRowCells || []) {
            spans.push(parseInt(cell.attributes.colspan));
        }
        console.log(spans);
        if(!table) throw new Error("Table not found");
        let appointments: HTMLElement[] = table.querySelectorAll(".week_block");
        for(let appointment of appointments) {
            let time = appointment.querySelector(".time")?.text;
            let from = time?.split("-")[0].trim();
            let to = time?.split("-")[1].trim();
            let name = appointment.querySelector(".name")?.text;
            let person = appointment.querySelector(".person")?.text;
            let room = appointment.querySelectorAll(".resource")[0]?.text;
            let course = appointment.querySelectorAll(".resource")[1]?.text;
            let temp = appointment.previousElementSibling;
            let i = 1;
            while(temp !== null){
                // if(temp.rawTagName === "tr") i++;
                temp = temp.previousElementSibling;
                i++;
            }
            let j = 0;
            for(let span of spans) {
                if(i <= span) break;
                i -= span;
                j++;
            }
            let day = ["montag", "dienstag", "mittwoch", "donnerstag", "freitag"][j] as 'montag' | 'dienstag' | 'mittwoch' | 'donnerstag' | 'freitag';
            if(data[day] === undefined) data[day] = [];
            data[day]!.push(
            {
                moduleName: name || "",
                from: from || "",
                to: to || "",
                room: room || "",
                person: person || "",
                course: course || ""
            });
        }
        console.log(data);

        return {meta:{kw, year: date.getFullYear() }, schedule: data};
    }
}

let intranet: IntranetFacade;
export const Intranet = {

    setInstance: (username: string, password: string) => {
        intranet = new IntranetFacade(username, password);
    },
    getInstance: () => {
        if(!intranet) throw new Error("Intranet not set");
        return intranet;
    }
}
