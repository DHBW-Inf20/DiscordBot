import { Client } from "discord.js"
import express from 'express';

// dotenv
import dotenv from 'dotenv';
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import Dualis from './interfaces/dualis';
import { StundenplanCanvas } from './misc/stundenplanCanvas';
dotenv.config({ path: ".env"});
// Load Config...
let config = loadConfig();
if (!config) {
    console.error("Failed to load config");
    process.exit(1);
}
console.log("Config loaded",config);

console.log("Bot is starting...");
const client = new Client({
    intents: []
});
// Initializing Listeners...
initListeners(client);

// Logging in
client.login(config.discord.token);

export let dualis = new Dualis(config.dualis.user, config.dualis.password);
function loadConfig(): Config | undefined {
    return {
        discord:{
            token: process.env.DISCORD_TOKEN || "",
            main_guild: process.env.DISCORD_MAIN_GUILD || ""
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

// start a simple express server
    const app = express();
    app.get("*", (req:any, res:any) => {
        res.status(200).send("Hello World!");
    });
    app.listen(process.env["PORT"], ()=>{
        console.log("Server started on port " + process.env["PORT"]);
    })
