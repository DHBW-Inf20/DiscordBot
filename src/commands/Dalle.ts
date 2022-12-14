import { BaseCommandInteraction, Client, ApplicationCommandOptionData } from 'discord.js';
import { Command } from "../types/command";
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
        },
        {
            name: "n",
            description: "Wie viele Bilder sollen generiert werden",
            type: "INTEGER",
            required: false,
            max_value: 5
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        const size = interaction.options.get("size")?.value as number | undefined;
        const n = (interaction.options.get("n")?.value || 1) as number;
        const sizeString = size === 1 ? "256x256" : size === 2 ? "512x512" : size === 3 ? "1024x1024" : "256x256";
        const openAiconfig = new Configuration({
            apiKey: config?.openaiKey
        })

        const openAi = new OpenAIApi(openAiconfig);

        await interaction.deferReply();

        try{

            const img = await openAi.createImage({
                prompt: interaction.options.get("prompt")?.value as string,
                n,
                size: sizeString
            })   
            let urlString = img.data.data[0].url;
            for(let i = 1; i < img.data.data.length; i++){
                urlString += `\n${img.data.data[i].url}`;   
            }

            await interaction.editReply({ content: `${urlString}` });
        }catch(err){
            console.log(err);
            await interaction.editReply({ content: "Fehler beim Generieren des Bildes" });
        }
    }
};

