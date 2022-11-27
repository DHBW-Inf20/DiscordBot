import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { LiveTickerHandler, liveTickerHandlerMap } from './../misc/liveTickerHandler';






export const LiveTicker: Command = {
    name: "liveticker",
    description: "Spielt einen Liveticker ab im momentanen Channel",
    type: "CHAT_INPUT",
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        const channelId = interaction.channelId;
        let liveTicker = liveTickerHandlerMap.get(`${channelId}`);
        if(liveTicker){
            liveTicker.stop();
            liveTickerHandlerMap.delete(`${channelId}`);
            await interaction.reply({ content: `Liveticker wurde beendet`});
            return;
        }else{
            await interaction.reply({ content: `Liveticker wurde gestartet`});
            liveTicker = new LiveTickerHandler(interaction.channel!);
            liveTickerHandlerMap.set(`${channelId}`, liveTicker);
            liveTicker.start();
        }
    }
};
