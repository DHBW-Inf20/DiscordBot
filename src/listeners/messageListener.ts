
import { Client } from 'discord.js';
import { config } from '../Bot';
import { Message } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import dba from '../misc/databaseAdapter';
import { chatHistory } from '../commands/Ask';

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
            
            console.log(msg)
            
            if (msg === "") {
                return;
            }


            const openAiconfig = new Configuration({
                apiKey: config?.openaiKey
            })

            // Choose a random entry from a array
            // const randomEntry = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

            const data = await dba.getInstance().getRandomWeightedDavinciData()
            if (!data) {
                return;
            }


            const openAi = new OpenAIApi(openAiconfig);
            chatHistory[message.author.id] = chatHistory[message.author.id] || [];

            if (chatHistory[message.author.id].length > 10) {
                chatHistory[message.author.id].shift();
            }

            chatHistory[message.author.id].push({ "role": "user", "content": msg });
            let chatGPTResponse = openAi.createChatCompletion({
                "model": "gpt-3.5-turbo",
                "messages": [
                    { "role": "system", "content": 'Du bist Horby, ein Bot der Informatik Studenten helfen soll. Du bist motivierend und lustig und beantwortest alle Fragen die dir gestellt werden' },
                    ...chatHistory[message.author.id]
                ]
            }).then(res => {
                chatHistory[message.author.id].push({ "role": "assistant", "content": res.data.choices[0].message?.content! });
                message.reply({ content: `\`\`\`${msg}\`\`\`\n${res.data.choices[0].message?.content!}`, allowedMentions: { repliedUser: false } });
            }).catch(err => {
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