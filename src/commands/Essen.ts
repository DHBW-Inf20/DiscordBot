import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";






export const Essen: Command = {
    name: "essen",
    description: "Predicted und lernt das optimale essen",
    type: "CHAT_INPUT",
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        await interaction.reply({ content: "Noch nicht implementiert", ephemeral: true });
        
        
       
    }
};
