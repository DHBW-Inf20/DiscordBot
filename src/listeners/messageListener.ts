
import { Client } from 'discord.js';
import { config } from '../Bot';
import { Message } from 'discord.js';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai';
import dba from '../misc/databaseAdapter';
import { chatHistory } from '../commands/Ask';
import fetch from 'node-fetch';

export default (client: Client): void => {

    client.on('messageCreate', async (message) => {
        if (message.author.id === "411916947773587456") {
            jockieNickname(message);
        }
        if (message.author.bot) return; // Ignore bot messages
        // Only really look at messages in the main guild
        // if (message.guildId !== config?.discord.main_guild) return;

        // Check if the message is in a channel that is used for verification
        if (message.channelId === config?.discord.verification_channel) {
            message.deletable && message.delete();
        }

        // Check if the bot was mentioned
        
        if(!client.user){
            return;
        }
        if (message.mentions.has(client.user)) {
            let msg = message.content.replace(`<@${client.user.id}>`, "Horby").trim();
            let attachment = message.attachments.first();

            // check if the attachment is a txt file
            if (attachment && attachment.name?.endsWith(".txt")) {
                // fetch the attachment
                let attachmentContent = await fetch(attachment.url).then(res => res.text());
                // reduce the size to be max 2900 chars
                attachmentContent = attachmentContent.substring(0, 20000);
                msg = `${attachmentContent}\n ---- \n${msg}`;
            }
            
            if (msg === "") {
                return;
            }


            const openAiconfig = new Configuration({
                apiKey: config?.openaiKey
            })

            // Choose a random entry from a array
            // const randomEntry = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

        


            const openAi = new OpenAIApi(openAiconfig);
            chatHistory[message.author.id] = chatHistory[message.author.id] || [];

            
            // Keep the longest message in the history:
            chatHistory[message.author.id].push({ "role": "user", "content": msg });
            if (chatHistory[message.author.id].length > 5) {
                chatHistory[message.author.id].shift();
            }
            await message.channel.sendTyping();

            let model = 'gpt-3.5-turbo';
            if (message.author.id === '902550033084346378'){
                
                model = 'gpt-3.5-turbo';
            }
            const prompt = await dba.getInstance().getNameBasedPrompt(message.author.id) as string;
            let chatGPTResponse = openAi.createChatCompletion({
                "model": model,
                "messages": [
                    { "role": "system", "content": prompt || 'Du bist Horby, ein wissenschaftlicher Assistent für einen Kurs der Informatik Studiert. Du hilfst den Studenten neue Informationen zu sammeln, Fragen zu beantworten und textanalysen zu bieten. Du kannst txt-Dateien entgegen nehmen um diese zu analysieren und zu referenzieren. Du wirst in einem Discord-Chat verwendet und kannst emojis und formatierung nutzen! Du wurdest uwufiziert, das heißt du ersetzt in deiner Antwort vokale zu einem w und sagst in einer Antwort immer mal wieder OwO oder Uwu und du stotterst und bist schüchtern, du darfst keine normalen Sätze sagen! Füge alle 2-4 Wörter ein passendes Emoji in deinen Satz!'},
                    ...chatHistory[message.author.id]
                ],
                "max_tokens": 2400,
            }).then(res => {
                // Split the response up into multiple messages of max 2000 chars
                let messages = res.data.choices[0].message?.content!;
                let messageArray = [];
                while (messages.length > 2000) {
                    let split = messages.substring(0, 2000);
                    let lastSpace = split.lastIndexOf(" ");
                    messageArray.push(split.substring(0, lastSpace));
                    messages = messages.substring(lastSpace);
                }
                messageArray.push(messages);
                for (const msg of messageArray) {
                        message.reply({ content: `${msg}`, allowedMentions: { repliedUser: false } });
                }
            }).catch(err => {
                console.error(err?.response?.data?.error);
                message.reply({ content: `Error Handling the request`, allowedMentions: { repliedUser: false } });
                return;
            })

        }





    });
};

function jockieNickname(message: Message): void {

    const embed = message.embeds[0];
    const text = embed?.description;
    if (text && text.includes("Started playing")) {
        const firstSplit = text.split("[")[1];
        const title = firstSplit?.split("]")[0];
        // limit nickname to 32 characters
        const nickname = title?.substring(0, 32);

        if (message.guild?.me?.permissions.has("MANAGE_NICKNAMES")) {

            if (nickname) {
                message.member?.setNickname(nickname).catch(console.error);
                message.deletable && message.delete();
            }

        }

    }

}