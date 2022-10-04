import { Client } from "discord.js"

// dotenv
import dotenv from 'dotenv';
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import Dualis from './interfaces/dualis';
import { StundenplanCanvas } from './misc/stundenplanCanvas';
import { Kantine } from './interfaces/kantine';
import ZitatHandler from "./misc/zitatHandler";
dotenv.config({ path: ".env"});
// Load Config...

export const config = loadConfig();
if (!config) {
    console.error("Failed to load config");
    process.exit(1);
}
console.log(new Date().toLocaleString() + " - Starting Bot...");
export const kantinenInterface = new Kantine(12);
export const dualisInterface = new Dualis(config.dualis.user, config.dualis.password);
export const zitateMap = {} as { [id: string]: ZitatHandler };
console.log("Bot is starting...");
export const client = new Client({
    intents: []
});
// Initializing Listeners...
initListeners(client);

// Logging in
client.login(config.discord.token);


function loadConfig(): Config | undefined {
    return {
        discord:{
            token: process.env.DISCORD_TOKEN || "",
            main_guild: process.env.DISCORD_MAIN_GUILD || "",
            zitate_channel: process.env.DISCORD_ZITATE_CHANNEL || "",
        },
        dualis:{
            user: process.env.DUALIS_USER || "",
            password: process.env.DUALIS_PASSWORD || ""
        }
    };
}

function initListeners(client: Client): void {
    ready(client);
    interactionCreate(client);
}
