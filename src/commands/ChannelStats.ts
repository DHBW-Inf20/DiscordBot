import { BaseCommandInteraction, Client, Collection, Message, TextBasedChannel, Channel, GuildChannel } from 'discord.js';
import { Command } from "../types/command";
import path from 'path';
import fs from 'fs';

export interface MessageStats {
    timestamp: Date;
    author: String;
    size: number;
}


export const ChannelStats: Command = {
    name: "channelstats",
    description: "Sammelt Chat-Statistiken in einem Channel (dauert bei langen Chats sehr lange)",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        
        const channel = interaction.channel;
        await interaction.deferReply({ ephemeral: true });
        if (channel === null) {
            await interaction.followUp({ content: "Dieser Command kann nur in einem Channel ausgeführt werden", ephemeral: true });
            return;
        }
        console.log("Fetching messages...");
        let lastTimeStamp = undefined;
        let isDone = false;
        let totalMessages = 0;
        let messageArray: MessageStats[] = [];
        do {
            // Get date in this format '%b %d %Y %I:%M%p'
            const messages = await channel.messages.fetch({
                limit: 100
                , before: lastTimeStamp
            }) as Collection<string, Message>;
            totalMessages += messages.size;
            console.log("Fetched messages n:" + totalMessages);
            messages.forEach(async (message) => {

                const messageDate = message.createdAt;
                const messageAuthor = message.author.username;
                const messageSize = message.content.length;
                messageArray.push({ timestamp: messageDate, author: messageAuthor, size: messageSize });
                lastTimeStamp = message.id;

            });

            isDone = messages.size < 100;
        } while (!isDone)

        // persist the array in a file named after the channel and guild
        const guild = interaction.guild;
        const guildName = guild?.name;
        const channelName = (channel as GuildChannel).name || "unknown";
        const fileName = `${guildName}_${channelName}.json`;
        const filePath = path.join(__dirname, '..', '..', 'data', fileName);
        // Check if folder exists
        if (!fs.existsSync(path.join(__dirname, '..', '..', 'data'))) {
            fs.mkdirSync(path.join(__dirname, '..', '..', 'data'));
        }
        const data = JSON.stringify(messageArray);
        fs.writeFileSync(filePath, data);
        await interaction.followUp({ content: `Es wurden ${totalMessages} Nachrichten gesammelt und in der Datei ${fileName} gespeichert`, ephemeral: true });


    }
};
