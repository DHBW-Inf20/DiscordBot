import { BaseCommandInteraction, Client } from "discord.js";
import { Command } from "../types/command";

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
        const content = "Noch nicht ganz fertig!";
        console.log(content);
        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};