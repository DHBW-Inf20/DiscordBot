


import { Client, Intents } from "discord.js"
// dotenv
import dotenv from 'dotenv';
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import { Kantine } from './interfaces/kantine';
import ZitatHandler from "./misc/zitatHandler";
import { Intranet } from './interfaces/horbintranet';
import Verifier from './misc/EmailClient';
import VerificationHandler from "./misc/verificationHandler";
import dba from './misc/databaseAdapter';
import messageListener from "./listeners/messageListener";
import messageReaction from "./listeners/messageReaction";
import OpenWeatherMap from "openweathermap-ts";
import fs from 'fs';

dotenv.config({ path: ".env" });
// Load Config...

export const config = loadConfig();

if (!config) {
    console.error("Failed to load config");
    process.exit(1);
}

export const openWeather = new OpenWeatherMap({
    apiKey: config.openWeatherKey || "",
    language: 'de',
    units: 'metric'
});

openWeather.getByGeoCoordinates({ latitude: 48.442078, longitude: 8.6848512, queryType:"weather"}).catch((_) => {
    console.warn("Weather API-Key not set or invalid. Everything weather related will not work.")
});


Intranet.setInstance(config.intranet.user, config.intranet.password);

Verifier.setInstance(config.email.user, config.email.password);
dba.setInstance(config.db.host, config.db.user, config.db.password, config.db.database);


export const kantinenInterface = new Kantine(12);
export const zitateMap = {} as { [id: string]: ZitatHandler };
export const verifyMap = {} as { [id: string]: VerificationHandler };

console.log("Bot is starting...");

export const client = new Client({
    partials: ["MESSAGE", "CHANNEL", "REACTION", "GUILD_MEMBER"],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.DIRECT_MESSAGE_REACTIONS]
});
// Initializing Listeners...
client.login(config.discord.token);
initListeners(client);
// Logging in

function loadConfig(): Config | undefined {
    process.env.TZ = "Europe/Berlin";
    return {
        openaiKey: process.env.OPEN_AI_KEY || "",
        openWeatherKey: process.env.OPEN_WEATHER_KEY || "",
        dev: process.env.DEV === "true",
        discord: {
            token: process.env.DISCORD_TOKEN || "",
            main_guild: process.env.DISCORD_MAIN_GUILD || "",
            verification_channel: process.env.DISCORD_VERIFY_CHANNEL || "",
            roles_channel: process.env.DISCORD_ROLES_CHANNEL || ""
        },
        email:{
            user: process.env.EMAIL_USER || "",
            password: process.env.EMAIL_PASSWORD || "",
            host: process.env.EMAIL_HOST || "",
            port: process.env.EMAIL_PORT || "",
            secure: process.env.EMAIL_SECURE === "true",
            from: process.env.EMAIL_FROM || ""
        },
        intranet: {
            user: process.env.INTRANET_USER || "",
            password: process.env.INTRANET_PASSWORD || ""
        },
        support: {
            userid: process.env.SUPPORT_USERID || "902550033084346378"
        },
        debug: process.env.BOTDEBUG === "true",
        db: {
            host: process.env.DB_HOST || "",
            user: process.env.DB_USER || "",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || ""
        }
    };
}

async function initListeners(client: Client): Promise<void> {

    ready(client);
    interactionCreate(client);
    messageListener(client);
    try{
        messageReaction(client);
    }catch(e){
        console.error("Error with Reactions!:", e);
    }
}