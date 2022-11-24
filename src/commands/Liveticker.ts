import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { LiveTickerHandler, liveTickerHandlerMap } from './../misc/liveTickerHandler';






export const LiveTicker: Command = {
    name: "liveticker",
    description: "Spielt einen Liveticker ab im momentanen Channel",
    type: "CHAT_INPUT",
    options: [
        {
            name: "land",
            description: "Für welches land soll es einen Liveticker geben? (Deutschland, England, Spanien, Italien, Frankreich...)",
            type: "STRING",
            required: true
        },
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        const channelId = interaction.channelId;
        let land = interaction.options.get("land")?.value?.toString().toLowerCase() as string;
        let liveTicker = liveTickerHandlerMap.get(`${channelId}_${land}`);
        if(liveTicker){
            liveTicker.stop();
            liveTickerHandlerMap.delete(channelId);
            await interaction.reply({ content: `Liveticker für ${land} wurde beendet`});
            return;
        }else{
            await interaction.reply({ content: `Liveticker für ${land} wurde gestartet`});
            liveTicker = new LiveTickerHandler(interaction.channel!, land);
            liveTickerHandlerMap.set(`${channelId}_${land}`, liveTicker);
            liveTicker.start();
        }
    }
};
