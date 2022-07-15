import { Client } from "discord.js"
import fs from 'fs'
import yaml from 'js-yaml';
import path from "path";
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import Dualis from './interfaces/dualis';
import { StundenplanCanvas } from './misc/stundenplanCanvas';

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

// let d = new Dualis(config.dualis.user, config.dualis.password);

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
    return yaml.load(fs.readFileSync(path.join(__dirname,'./config.yaml'), 'utf8')) as Config | undefined;
}

function initListeners(client: Client): void {
    ready(client);
    interactionCreate(client);
}