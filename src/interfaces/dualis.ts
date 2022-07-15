import fetch from 'node-fetch'
import {parse} from 'node-html-parser'
import { Grade } from 'types/dualis';
import { Schedule } from '../types/dualis';
import fs from 'fs';
interface dualis {
    user: string;
    password: string;
    baseUrl: "https://dualis.dhbw.de/scripts/mgrqispi.dll";
    sessionCookie?: string;
    sessionId?: string;
    lastN?:number;

    isSessionValid: () => Promise<boolean>;
    login: () => Promise<void>;
    getGrades: () => Promise<any>;
    getSchedule: (n?:number) => Promise<any>;
}

export default class Dualis implements dualis{
    user: string;
    password: string;
    sessionCookie?: string | undefined;
    sessionId?: string | undefined;
    baseUrl: "https://dualis.dhbw.de/scripts/mgrqispi.dll" = "https://dualis.dhbw.de/scripts/mgrqispi.dll";
    lastN?:number;
    constructor(user: string, password: string) {
        this.user = user;
        this.password = password;
    }

    isSessionValid: () => Promise<boolean> = async () => {
        console.log(this.sessionCookie, this.sessionId);
        const response = await fetch(`${this.baseUrl}?APPNAME=CampusNet&PRGNAME=MLSSTART&ARGUMENTS=${this.sessionId},-N000019,`,{
            method: "GET",
            headers:{
                "Cookie": `cnsc=${this.sessionCookie}`
            }
        }) 

        let html:string = await response.text();
        let parsed = parse(html);
        let valid = false;
        try{
            let errorText =  parsed.getElementsByTagName("h1")[0].childNodes[0].rawText;
            if(errorText !== "Zugang verweigert"){
                valid = true;
            }

        }catch(e:any){
            valid = true;
        }
        finally{
            console.log(valid);
            return valid;
        }
        
    }


    login: () => Promise<void> = async () => {
        // Make a request to the baseURL to get the session cookie
        // URLEncode the user and password
        
        const response = await fetch(`${this.baseUrl}?usrname=${encodeURIComponent(this.user).replace(/!/g, '%21')}%40hb.dhbw-stuttgart.de&pass=${encodeURIComponent(this.password).replace(/!/g, '%21')}&APPNAME=CampusNet&PRGNAME=LOGINCHECK&ARGUMENTS=clino%2Cusrname%2Cpass%2Cmenuno%2Cmenu_type%2Cbrowser%2Cplatform&clino=000000000000001&menuno=000324&menu_type=classic&browser=&platform=`, {
            method: "POST",
            body: `usrname=${encodeURIComponent(this.user).replace(/!/g, '%21') }%40hb.dhbw-stuttgart.de&pass=${encodeURIComponent(this.password).replace(/!/g, '%21') }&APPNAME=CampusNet&PRGNAME=LOGINCHECK&ARGUMENTS=clino%2Cusrname%2Cpass%2Cmenuno%2Cmenu_type%2Cbrowser%2Cplatform&clino=000000000000001&menuno=000324&menu_type=classic&browser=&platform=`
        });
        console.log(`usrname=${encodeURIComponent(this.user).replace(/!/g, '%21')}&pass=${encodeURIComponent(this.password).replace(/!/g, '%21') }&APPNAME=CampusNet&PRGNAME=LOGINCHECK&ARGUMENTS=clino%2Cusrname%2Cpass%2Cmenuno%2Cmenu_type%2Cbrowser%2Cplatform&clino=000000000000001&menuno=000324&menu_type=classic&browser=&platform=`);
        
        console.log(response.status);
        console.log(response.headers);
        console.log(await response.text());
        this.sessionCookie = response.headers.get("set-cookie")?.split(";")[0].split("=")[1];
        this.sessionId = response.headers.get("REFRESH")?.slice(84,84+17);
    }


    getGrades: () => Promise<{
        grades: Grade[];
        semester: string;
    }> = async () => {
        if(!this.sessionCookie || !this.sessionId || !(await this.isSessionValid())){
            await this.login();
        }
        const response = await fetch(`${this.baseUrl}?APPNAME=CampusNet&PRGNAME=COURSERESULTS&ARGUMENTS=${this.sessionId},-N000307,`, {
            method: "GET",
            headers: {
                "Cookie": `cnsc=${this.sessionCookie}`
            }
        });
        let html:string = await response.text();
        let parsed = parse(html);
        let semester = parsed.getElementById("semester").getElementsByTagName("option").filter(option =>{
            return option.getAttribute("selected") === "selected";
        })[0].rawText;
        console.log(semester);
        let table = parsed.getElementsByTagName("table")[0];
        let rows = table.getElementsByTagName("tr");
        let grades: Grade[] = [];
        rows.splice(0,1).forEach(row => {
            let cols = row.getElementsByTagName("td");
            let grade = {
                moduleId: cols[0].childNodes[0].rawText.trim(),
                moduleName: cols[1].childNodes[0].rawText.trim(),
                grade: cols[2].childNodes[0].rawText.trim() !== "noch nicht gesetzt"
            }
            grades.push(grade);
        })
        return {grades, semester};
    }
    getSchedule: (n?: number) => Promise<{
        meta: {
            kw: number;
            year: number;
        }
        schedule: {
            montag: Schedule[];
            dienstag: Schedule[];
            mittwoch: Schedule[];
            donnerstag: Schedule[];
            freitag: Schedule[];
    }}> = async (n?:number) => {
        if(!this.sessionCookie || !this.sessionId || !(await this.isSessionValid())){
            await this.login();
        }
        n = n || this.lastN;
        if(!n){
            this.lastN = n = 0;
        }
        this.lastN = n;
        // Get current time
        let [year, week] = getWeekNumber(new Date());
        week+=n;
        if(week > 52){
            week = week - 52;
            year++;
        }else if (week < 1){
            week = week + 52;
            year--;
        }   
        let startDate = getDateOfISOWeek(week, year);
        const dateString = `${("0" + startDate.getDate()).slice(-2)}/${("0" + (startDate.getMonth() + 1)).slice(-2)}/${startDate.getFullYear()}`;
        console.log(`${this.baseUrl}/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=SCHEDULER&ARGUMENTS=${this.sessionId},-N000028,-A${dateString},-A,-N1,-N000000000000000,-N1`);
        console.log(week, year);
        let response = await fetch(`${this.baseUrl}/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=SCHEDULER&ARGUMENTS=${this.sessionId},-N000028,-A${dateString},-A,-N1,-N0,-N0`, {
            method: "GET",
            headers: {
                "Cookie": `cnsc=${this.sessionCookie}`
            }
        });
        let html:string = await response.text();
        //save the html in a file
        fs.writeFileSync("schedule.html", html);

        let parsed = parse(html);
        let schedule = {} as {
            montag: Schedule[];
            dienstag: Schedule[];
            mittwoch: Schedule[];
            donnerstag: Schedule[];
            freitag: Schedule[];
          };
        parsed.getElementsByTagName('td').filter(td=>td.attributes.class==="appointment").forEach(td =>{
            let weekday = td.attributes.abbr.split(" ")[0].toLowerCase() as 'montag' | 'dienstag' | 'mittwoch' | 'donnerstag' | 'freitag';
            let name = td.getElementsByTagName("a")[0].rawText.trim();
            let from = td.getElementsByTagName("span")[0].rawText.trim().split("-")[0].trim();
            let to = td.getElementsByTagName("span")[0].rawText.trim().split("-")[1].trim().replace(/\s+/g, '$').split("$")[0].trim();
            let room = td.getElementsByTagName("span")[0].rawText.trim().replace(/\s+/g, '').slice(11);
            let sched:Schedule = {
                moduleName:name,
                from,
                to,
                room
            }
            if (schedule[weekday] === undefined) schedule[weekday] = [];
            schedule[weekday].push(sched);
        });
        console.log(schedule);
        return {
            meta: {
                kw: week,
                year
            },
            schedule
        };
    }

}


/* For a given date, get the ISO week number
 *
 * Based on information at:
 *
 *    THIS PAGE (DOMAIN EVEN) DOESN'T EXIST ANYMORE UNFORTUNATELY
 *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
 *
 * Algorithm is to find nearest thursday, it's year
 * is the year of the week number. Then get weeks
 * between that date and the first day of that year.
 *
 * Note that dates in one year can be weeks of previous
 * or next year, overlap is up to 3 days.
 *
 * e.g. 2014/12/29 is Monday in week  1 of 2015
 *      2012/1/1   is Sunday in week 52 of 2011
 */
export function getWeekNumber(d:Date) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    // Return array of year and week number
    return [d.getUTCFullYear(), weekNo];
}

export function getDateOfISOWeek(w:number, y:number) {
    var simple = new Date(y, 0, 1 + (w - 1) * 7);
    var dow = simple.getDay();
    var ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}
