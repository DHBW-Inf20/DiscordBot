import { Client } from "discord.js"
import fs from 'fs'
import yaml from 'js-yaml';
import path from "path";
import { Config } from "./types/misc";
import interactionCreate from "./listeners/interactionCreate";
import ready from "./listeners/ready";
import Dualis from './interfaces/dualis';

// Load Config...
let config = loadConfig();
if (!config) {
    console.error("Failed to load config");
    process.exit(1);
}

// console.log("Bot is starting...");
// const client = new Client({
//     intents: []
// });
// // Initializing Listeners...
// initListeners(client);

// // Logging in
// client.login(config.discord.token);

let d = new Dualis(config.dualis.user, config.dualis.password);
d.getGrades();
function loadConfig(): Config | undefined {
    return yaml.load(fs.readFileSync(path.join(__dirname,'./config.yaml'), 'utf8')) as Config | undefined;
}

function initListeners(client: Client): void {
    ready(client);
    interactionCreate(client);
}