


import { Client } from "discord.js"
import sqlite3 from 'sqlite3';
// dotenv
import dotenv from 'dotenv';
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import Dualis from './interfaces/dualis';
import { Kantine } from './interfaces/kantine';
import ZitatHandler from "./misc/zitatHandler";
import { Intranet } from './misc/horbintranet';
dotenv.config({ path: ".env" });
// Load Config...

export const config = loadConfig();

if (!config) {
    console.error("Failed to load config");
    process.exit(1);
}

// use PKCS#1 padding (RSA_PKCS1_PADDING)
//console.log(k.encryptPrivate('Hello RSA!', 'base64'));

Intranet.setInstance(config.intranet.user, config.intranet.password);


let d = new Date();
d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
console.log(d.toLocaleString() + " - Starting Bot...");
export const kantinenInterface = new Kantine(12);
export const dualisInterface = new Dualis(config.dualis.user, config.dualis.password);
export const zitateMap = {} as { [id: string]: ZitatHandler };
console.log("Bot is starting...");
export const client = new Client({
    intents: []
});
// Initializing Listeners...
initListeners(client);
setupNeskeDb();
// Logging in
console.log(config.discord.token);
client.login(config.discord.token);


function loadConfig(): Config | undefined {
    return {
        discord: {
            token: process.env.DISCORD_TOKEN || "",
            main_guild: process.env.DISCORD_MAIN_GUILD || "",
            zitate_channel: process.env.DISCORD_ZITATE_CHANNEL || "",
        },
        dualis: { 
            user: process.env.DUALIS_USER || "",
            password: process.env.DUALIS_PASSWORD || ""
        },
        email:{
            user: process.env.EMAIL_USER || "",
            password: process.env.EMAIL_PASSWORD || ""
        },
        intranet: {
            user: process.env.INTRANET_USER || "",
            password: process.env.INTRANET_PASSWORD || ""
        }
    };
}

function initListeners(client: Client): void {
    ready(client);
    interactionCreate(client);
}

function setupNeskeDb(): void {
    let db = new sqlite3.Database('./neske.db', (err) => {
        if (err) {+
            console.error(err.message);
            return;
        }
        console.log('Connected to the in-memory SQlite database.');
    });

    
    db.run("CREATE TABLE IF NOT EXISTS neskecounter (name TEXT, count INTEGER)", (err) => {
        if (err) {
            return console.error(err.message);
        }
    }
    );
    // check if there is already a counter in the database
    db.get('SELECT * FROM neskecounter', (err, row) => {
        if (err) {
            console.log(err);
        }
        // if there is no counter in the database, create one
        if (!row) {
            db.run('INSERT INTO neskecounter (name, count) VALUES (\'zeichen\', 0)',  (err) => {
                if (err) {
                    console.log(err);
                }
            });
            db.run('INSERT INTO neskecounter(name, count) VALUES (\'sach\', 0)',  (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
    db.close();
}