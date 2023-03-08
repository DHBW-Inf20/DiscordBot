import { config, zitateMap } from '../Bot';
import {
    Client,
    ContextMenuInteraction,
} from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import { ContextMenuCommand } from "../types/command";
import { Configuration, OpenAIApi } from 'openai';
import dba, { IDavinciData } from '../misc/databaseAdapter';

let chatHistory: {[key:string]: string[]} = {};

export const Ask: ContextMenuCommand = {
    name: "Horby fragen",
    type: "MESSAGE",
    run: async (client: Client, interaction: ContextMenuInteraction) => {

        if (interaction.user.id === "377396628660813824") {
            interaction.reply({ content: "Du kannst mich nicht fragen, du hs!", ephemeral: false });
            return;
        }
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
        // const randomEntry = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

        const data = await dba.getInstance().getRandomWeightedDavinciData()
        if(!data){
            await interaction.followUp({ content: "Fehler beim Generieren einer antwort" });
            return;
        }
        let customPrompt = msg.content.startsWith('#');

        
        const openAi = new OpenAIApi(openAiconfig);
        chatHistory[msg.author.id] = chatHistory[msg.author.id] || [];
        
        if (chatHistory[msg.author.id].length > 5) {
            chatHistory[msg.author.id].shift();
        }
        chatHistory[msg.author.id].push(msg.content);
        let chatMessages = chatHistory[msg.author.id].map((msg, index) => {
            return {
                "role": "user",
                "content": msg
            }
        });
        let chatGPTResponse = openAi.createCompletion({
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "Du bist Dietmar Zende, ein Dozent an der DHBW Horb für das Fach Consulting. Du hast eine eigene Vertriebsfirma mit dem Namen Boss-Factory und beantwortest fragen über Consulting und dem technischen Vertrieb, du bist sehr von dir überzeugt."},
                [...chatMessages]
            ]
        } as unknown as any).then(res => {
            interaction.followUp({ content: `\`\`\`${msg?.content}\`\`\`\n${res.data.choices[0].text}` });
        }).catch(err => {
            console.log(err);
            interaction.followUp({ content: "Fehler beim Generieren einer antwort" });
            return;
        })
        // let response = openAi.createCompletion({
        //     "model": "text-davinci-003",
        //     "prompt": `${customPrompt ? msg.content.substring(1) : `${data?.personality_description} ${msg.content} \n Horby: `}\n}`,
        //     "temperature": data?.temperature,
        //     "max_tokens": data?.max_tokens,
        //     "top_p": data?.top_p,
        //     "frequency_penalty": 0,
        //     "presence_penalty": 0
        // }).then(res => {
        //     interaction.followUp({ content: `\`\`\`${msg?.content}\`\`\`\n${res.data.choices[0].text}` });
        // }).catch(err => {
        //     console.log(err);
        //     interaction.followUp({ content: "Fehler beim Generieren einer antwort" });
        //     return;
        // })
    }
};