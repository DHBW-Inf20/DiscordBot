import { ApplicationCommandOptionData, BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";
import { LiveTickerHandler, liveTickerHandlerMap } from './../misc/liveTickerHandler';




export const LiveTicker: Command = {
    name: "liveticker",
    description: "Spielt einen Liveticker ab im momentanen Channel",
    type: "CHAT_INPUT",
    options:   [
        {
            name: "api",
            description: "Welche API soll verwendet werden?",
            type: "INTEGER",
            required: false,
            choices: [
                {
                    name: "wmk",
                    value: 0
                },
                {
                    name: "WM2022",
                    value: 1
                }
            ]
        }
     ],
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
