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

        const openAiconfig = new Configuration({
            apiKey: config?.openaiKey
        })

        const openAi = new OpenAIApi(openAiconfig);

        interaction.deferReply();

        try{

            const img = await openAi.createImage({
                prompt: interaction.options.get("prompt")?.value as string,
                n:1,
                size: '256x256'
            })   
            

            await interaction.editReply({ content: `${img.data.data[0].url}` });
        }catch(err){
            console.log(err);
            await interaction.editReply({ content: "Fehler beim Generieren des Bildes" });
        }
    }
};

