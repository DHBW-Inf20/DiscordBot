import { BaseCommandInteraction, Client } from "discord.js";
import { Command } from "../types/command";

export const Kantine: Command = {
    name: "kantine",
    description: "Informiert dich über das momentane Angebot der Kantine.",
    type: "CHAT_INPUT",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        const content = "Hello there!";
        await interaction.followUp({
            ephemeral: true,
            content
        });
    }
};