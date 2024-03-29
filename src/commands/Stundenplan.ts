import {
    BaseCommandInteraction,
    Client,
} from "discord.js";
import { Command } from "../types/command";
import { newStundenplanHandler } from "../misc/stundenplanHandler";

// Globally used constants by this command-Family

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
        },
        {
            name: "course",
            description: "Welcher Kurs soll angezeigt werden?",
            type: "STRING",
            required: false
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {     
        await newStundenplanHandler(interaction);
    }
};

