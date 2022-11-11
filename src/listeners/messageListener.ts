
import { Client } from 'discord.js';
import { config } from '../Bot';

export default (client: Client): void => {
    client.on('messageCreate', (message) => {
        if(message.author.bot) return; // Ignore bot messages
        // Only really look at messages in the main guild
        if(message.guildId !== config?.discord.main_guild) return;

        // Check if the message is in a channel that is used for verification
        if(message.channelId === config?.discord.verification_channel) {
            message.deletable && message.delete();
        }
        
    });
};