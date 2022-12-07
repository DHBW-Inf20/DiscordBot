import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { Configuration, OpenAIApi } from "openai";
import { config } from './../Bot';








export const Dalle: Command = {
    name: "dalle",
    description: "Generiert ein img mit Dalle",
    type: "CHAT_INPUT",
    options: [
        {
            name: "prompt",
            description: "Was soll generiert werden",
            type: "STRING",
            required: true
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        console.log(config?.openaiKey)
        const openAiconfig = new Configuration({
            apiKey: config?.openaiKey
        })

        const openAi = new OpenAIApi(openAiconfig);

        interaction.deferReply();

        const img = await openAi.createImage({
            prompt: interaction.options.get("prompt")?.value as string,
            n:1,
            size: '256x256'
         })
         
        //  console.log(img, img.data);
        // const imgUrl = img
        await interaction.editReply ({ content: img.data.data[0].url });
    }
};

