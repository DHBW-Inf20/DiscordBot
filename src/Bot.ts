import { Client } from "discord.js"
import fs from 'fs'
import yaml from 'js-yaml';
import path from "path";
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

console.log("Bot is starting...");
const client = new Client({
    intents: []
});
// Initializing Listeners...
initListeners(client);

// Logging in
client.login(config.discord.token);

export let dualis = new Dualis(config.dualis.user, config.dualis.password);

let spC = new StundenplanCanvas({
    freitag: [
        {
            moduleName: 'Rechnerarchitekturen',
            from: '08:30',
            to: '12:15',
            room: 'HOR-120'
        },
        {
            moduleName: 'Betriebssysteme',
            from: '13:00',
            to: '16:30',
            room: 'HOR-120'
        }
    ],
    dienstag: [
        {
            moduleName: 'Netztechnik',
            from: '09:00',
            to: '12:00',
            room: 'HOR-120'
        }
    ],
    donnerstag: [
        {
            moduleName: 'GL SW-Engineering',
            from: '09:00',
            to: '12:30',
            room: 'HOR-120'
        }
    ],
    montag: [
        {
            moduleName: 'Statistik',
            from: '13:45',
            to: '17:15',
            room: 'HOR-120'
        }
    ]
},18, 2022)
    spC.renderCanvas();
    spC.saveImage('./stundenplan.png');
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