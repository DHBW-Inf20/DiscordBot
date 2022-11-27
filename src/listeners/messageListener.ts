
import { Client } from 'discord.js';
import { config } from '../Bot';
import { Message } from 'discord.js';

export default (client: Client): void => {

    client.on('messageCreate', (message) => {
        if (message.author.id === "411916947773587456") {
            jockieNickname(message);
        }
        if (message.author.bot) return; // Ignore bot messages
        // Only really look at messages in the main guild
        if (message.guildId !== config?.discord.main_guild) return;

        // Check if the message is in a channel that is used for verification
        if (message.channelId === config?.discord.verification_channel) {
            message.deletable && message.delete();
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