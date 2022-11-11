import { createTransport } from "nodemailer";
import mailgunTransport from "nodemailer-mailgun-transport";
import fs from "fs";
import path from "path";
import Handlebars from 'handlebars';

interface emailVerification {
    sendVerificationEmail(email: string): void;
    verifyEmail(email: string, code: string): Promise<boolean>;
}

class EmailVerification implements emailVerification {

    transporter:any;
    template:any;
    constructor(user: string, password:string) {
        
        const mailgunAuthObj = {
            auth: {
                api_key: process.env.MAILGUN_API_KEY || "54518ef9a89be3378a24bcb906d9be90-48c092ba-82c3f558",
                domain: process.env.MAILGUN_DOMAIN || "sandbox76e5aff775fd4bf4a63cc1f7f8207982.mailgun.org"
            }
        }
        const emailTs = fs.readFileSync(path.join(__dirname, "../assets/emailTemplate.hbs"), "utf-8");
        this.template = Handlebars.compile(emailTs);
        this.transporter = createTransport({
            host: "smtp.strato.de",
            port: 465,
            secure: true,
            auth: {
                user: user,
                pass: password
            }
        }); 
    }

    sendVerificationEmail(email: string){
        const emailOptions = {
            from: "noreply@dhbot.de",
            to: email,
            subject: "Email Verifizierung",
            html: this.template({code: "123456"})
        }

        this.transporter.sendMail(emailOptions, (err:any, info:any) => {
            if (err) {
                console.log(err);
            } else {
                console.log(info);
            }
        });
    }
    verifyEmail(email: string, code: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    

}

let verifier: EmailVerification;
const Verifier = {
    setInstance: (email:string, password:string) => {
        verifier = new EmailVerification(email, password);
    },
    getInstance: () => {
        if(!verifier) throw new Error("Instance not set");
        return verifier;
    }
}
export default Verifier;