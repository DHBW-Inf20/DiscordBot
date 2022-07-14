import fetch from 'node-fetch'
import {parse} from 'node-html-parser'
import { Grade } from 'types/dualis';
interface dualis {
    user: string;
    password: string;
    baseUrl: "https://dualis.dhbw.de/scripts/mgrqispi.dll";
    sessionCookie?: string;
    sessionId?: string;

    isSessionValid: () => Promise<boolean>;
    login: () => Promise<void>;
    getGrades: () => Promise<any>;
    getSchedule: () => Promise<any>;
}

export default class Dualis implements dualis{
    user: string;
    password: string;
    sessionCookie?: string | undefined;
    sessionId?: string | undefined;
    baseUrl: "https://dualis.dhbw.de/scripts/mgrqispi.dll" = "https://dualis.dhbw.de/scripts/mgrqispi.dll";
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
        
        const response = await fetch(this.baseUrl, {
            method: "POST",
            body:`usrname=${encodeURIComponent(this.user)}%40hb.dhbw-stuttgart.de&pass=${encodeURIComponent(this.password)}&APPNAME=CampusNet&PRGNAME=LOGINCHECK&ARGUMENTS=clino%2Cusrname%2Cpass%2Cmenuno%2Cmenu_type%2Cbrowser%2Cplatform&clino=000000000000001&menuno=000324&menu_type=classic&browser=&platform=`
        });
        
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
    getSchedule: () => Promise<any> = async () => {
            return true;
    }

}
