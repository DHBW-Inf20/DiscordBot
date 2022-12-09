import { config, zitateMap } from '../Bot';
import {
    Client,
    ContextMenuInteraction,
    Modal,
    MessageActionRow,
    TextInputComponent,
    ModalActionRowComponent,
} from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import { ContextMenuCommand } from "../types/command";
import { Configuration, OpenAIApi } from 'openai';
import dba, { IDavinciData } from '../misc/databaseAdapter';

export const Ask: ContextMenuCommand = {
    name: "Horby fragen",
    type: "MESSAGE",
    run: async (client: Client, interaction: ContextMenuInteraction) => {

        let msg = interaction.options.get("message")?.message;

        if (!msg) {
            await interaction.followUp({ content: "Es konnte keine Nachricht erkannt werden!" });
            return;
        }

        interaction.deferReply();

        const openAiconfig = new Configuration({
            apiKey: config?.openaiKey
        })

        // Choose a random entry from a array
        const personalityIndex = 1;
        // const randomEntry = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

        const data = await dba.getInstance().getRandomDavinciData()
        if(!data){
            await interaction.followUp({ content: "Fehler beim Generieren einer antwort" });
            return;
        }
        let customPrompt = msg.content.startsWith('#');



        const openAi = new OpenAIApi(openAiconfig);
        let response = openAi.createCompletion({
            "model": "text-davinci-003",
            "prompt": `${customPrompt ? msg.content.substring(1) : `${data?.personality_description} ${msg.content} \n Horby: `}\n}`,
            "temperature": data?.temperature,
            "max_tokens": data?.max_tokens,
            "top_p": data?.top_p,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }).then(res => {
            interaction.followUp({ content: `\`\`\`${msg?.content}\`\`\`\n${res.data.choices[0].text}` });
        }).catch(err => {
            console.log(err);
            interaction.followUp({ content: "Fehler beim Generieren einer antwort" });
            return;
        })
    }
};