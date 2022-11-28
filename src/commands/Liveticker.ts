import { ApplicationCommandOptionData, BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { LiveTickerHandler, liveTickerHandlerMap } from './../misc/liveTickerHandler';


let cmd = new SlashCommandBuilder().setName("liveticker").setDescription("Spielt einen Liveticker ab im momentanen Channel").addIntegerOption(option =>
    option.setName("api")
        .setDescription("Welche Openligadb API soll verwendet werden?")
        .setRequired(false)
        .addChoices(
            { value: 0, name: "wmk" },
            { value: 1, name: "WM2022" },
        ));





export const LiveTicker: Command = {
    name: "liveticker",
    description: "Spielt einen Liveticker ab im momentanen Channel",
    type: "CHAT_INPUT",
    options:   [ (cmd.options[0] as unknown as ApplicationCommandOptionData)],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        const apiN = interaction.options.get("api")?.value || 0;
        const api = ["wmk", "WM2022"][apiN as number];
        const channelId = interaction.channelId;
        let liveTicker = liveTickerHandlerMap.get(`${channelId}`);
        if(liveTicker){
            liveTicker.stop();
            liveTickerHandlerMap.delete(`${channelId}`);
            await interaction.reply({ content: `Liveticker wurde beendet`});
            return;
        }else{
            await interaction.reply({ content: `Liveticker wurde gestartet`});
            liveTicker = new LiveTickerHandler(interaction.channel!, api);
            liveTickerHandlerMap.set(`${channelId}`, liveTicker);
            liveTicker.start();
        }
    }
};
