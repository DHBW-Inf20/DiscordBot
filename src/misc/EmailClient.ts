import { createTransport } from "nodemailer";
import fs from "fs";
import path from "path";
import Handlebars from 'handlebars';

interface emailVerification {
    sendVerificationEmail(email: string, code: string, dcuser:string): void;
    verifyEmail(email: string, code: string): Promise<boolean>;
}

class EmailVerification implements emailVerification {
    transporter: any;
    template: any;
    pendingVerifications: Map<string, string> = new Map();
    constructor(user: string, password: string) {
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

    sendVerificationEmail(email: string, code: string, dcuser: string) {
        const emailOptions = {
            from: "noreply@dhbot.de",
            to: email,
            subject: "Email Verifizierung",
            html: this.template({ code, user: email.split("@")[0], dcuser})
        }

        this.transporter.sendMail(emailOptions, (err: any, info: any) => {
            if (err) {
                console.log(err);
            } else {
                this.pendingVerifications.set(email, code);
            }
        });
    }
    verifyEmail(email: string, code: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            
            // delete the entry
            if (this.pendingVerifications.get(email) === code) {
                this.pendingVerifications.delete(email);
                resolve(true);
            } else {
                resolve(false);
            }

        });
    }



}

let verifier: EmailVerification;
const Verifier = {
    setInstance: (email: string, password: string) => {
        verifier = new EmailVerification(email, password);
    },
    getInstance: () => {
        if (!verifier) throw new Error("Instance not set");
        return verifier;
    }
}
export default Verifier;