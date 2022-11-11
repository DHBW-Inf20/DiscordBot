import fetch from "node-fetch";
import NodeRSA from "node-rsa";
import { exit } from "process";
import { URLSearchParams } from "url";

interface HorbIntranetFacade {
    getStundenplan(kurs: string, day: number): Promise<string>;
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
        const publicKey = await response.text();
        const n = publicKey.split(":");
        const key = new NodeRSA();
        key.setOptions({ encryptionScheme: 'pkcs1' });
        key.importKey({n: Buffer.from(n[0],'hex'), e: parseInt(n[1],16)}, 'components-public')
        const encryptedPassword = key.encrypt(this.password, 'base64');
        const sessid = response.headers.get('set-cookie')?.split(';')[0].split('=')[1];
        this.sessid = sessid || "";
        const encodedParams = new URLSearchParams();
        encodedParams.set('user', `${this.username}`);
        encodedParams.set('pass', `rsa:${encryptedPassword}`);
        encodedParams.set('logintype', 'login');
        encodedParams.set('pid', '404');
        encodedParams.set('referer', 'https://www.hb.dhbw-stuttgart.de/intranet.html');
        url = 'https://www.hb.dhbw-stuttgart.de/intranet.html';
        options = {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Cookie': `PHPSESSID=${this.sessid}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                "Host": "www.hb.dhbw-stuttgart.de",
                "Cache-Control": "max-age=0",
                "Sec-Ch-Ua-Mobile": "?0",
                "Upgrade-Insecure-Requests": "1",
                "Origin": "https://www.hb.dhbw-stuttgart.de",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Dest": "document",
                "Referer": "https:\/\/www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                "Connection": "close"
            },
            body: encodedParams.toString()
        };
        // console.log(options)
        let typouserresponse = await fetch(url, options);
        console.log(typouserresponse.status, typouserresponse.statusText);
        console.log(await typouserresponse.text());
        this.typoid = typouserresponse.headers.get('set-cookie')?.split(';')[0].split('=')[1] || "";
        if(this.typoid === "") throw new Error("Typoid is empty");
        return true;
    }

    async getStundenplan(kurs: string, day: number): Promise<string> {
        if (!await this.logIn()) throw new Error("Login failed");
        console.log(this.typoid, this.sessid);
        let url = `http://www.hb.dhbw-stuttgart.de/2067.html`;
        let options: any = {
            method: 'GET',
            headers: {
                'Host': 'www.hb.dhbw-stuttgart.de',
                'Cookie': `PHPSESSID=${this.sessid.trim()}; fe_typo_user=${this.typoid.trim()}`,
                "Sec-Ch-Ua": "\"Chromium\";v=\"107\", \"Not=A?Brand\";v=\"24\"",
                "Sec-Ch-Ua-Mobile": "?0",
                "Sec-Ch-Ua-Platform": "\"Windows\"",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.5304.107 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-User": "?1",
                "Sec-Fetch-Dest": "document",
                "Referer": "https://www.hb.dhbw-stuttgart.de/intranet.html",
                "Accept-Encoding": "gzip, deflate",
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
                "Connection": "close",
            }
        };
        let response = await fetch(url, options);
        let html = response.status;
        console.log(html, (await response.text()));
        return "";
    }
}

let intranet: IntranetFacade;
export const Intranet = {

    setInstance: (username: string, password: string) => {
        intranet = new IntranetFacade(username, password);
    },
    getIntranetFacade: () => {
        if(!intranet) throw new Error("Intranet not set");
        return intranet;
    }
}
