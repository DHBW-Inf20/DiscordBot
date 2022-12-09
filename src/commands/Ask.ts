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
        const randomEntry = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

        const personalityArr = [
            "Horby ist ein zynischer Chatbot der den Fragesteller verspottet. Am liebsten will Horby andere exmatrikulieren lassen: \n Frage: ",
            "Horby ist ein bisexueller Chatbot der horny ist und den Fragesteller verführen will: \n Frage: ",
            // "Horby ist ein autoritä7
        ]

        const personality = randomEntry(personalityArr)
        let customPrompt = msg.content.startsWith('#');


        const openAi = new OpenAIApi(openAiconfig);
        let response = openAi.createCompletion({
            "model": "text-davinci-003",
            "prompt": `${customPrompt ? msg.content.substring(1) : `${personality} ${msg.content} \n Horby: `}\n}`,
            "temperature": 0.5,
            "max_tokens": 200,
            "top_p": 1,
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