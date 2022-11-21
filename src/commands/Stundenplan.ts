import {
    BaseCommandInteraction,
    ButtonInteraction,
    Client,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
} from "discord.js";
import { Command } from "../types/command";
import { StundenplanCanvas } from '../misc/stundenplanCanvas';
import { randomUUID } from "crypto";
import { Intranet } from './../interfaces/horbintranet';
import dba from './../misc/databaseAdapter';
import { newStundenplanHandler } from "../misc/stundenplanHandler";

// Globally used constants by this command-Family
const constantButtonRow = new MessageActionRow().addComponents([
    new MessageButton().setCustomId('previousWeek').setLabel('<< Vorherige Woche').setStyle('SECONDARY'),
    new MessageButton().setCustomId('nextWeek').setLabel('Nächste Woche >>').setStyle('SECONDARY')
])

export const Stundenplan: Command = {
    name: "stundenplan",
    description: "Zeigt einen Stundenplan an",
    type: "CHAT_INPUT",
    options: [
        {
            name: "woche",
            description: "Welche Woche soll angezeigt werden? (n viele Wochen in die Zukunft)",
            type: "INTEGER",
            required: false
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {     
        await newStundenplanHandler(interaction);
    }
};

