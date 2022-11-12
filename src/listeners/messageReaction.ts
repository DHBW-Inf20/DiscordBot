
import { Client } from 'discord.js';
import { config } from '../Bot';

export default (client: Client): void => {

    

    client.on('messageReactionAdd', async (reaction, user) => {
        if(reaction.message.partial) await reaction.message.fetch();
        if(reaction.partial) await reaction.fetch();
        if(user.bot) return; // Ignore bot messages

        // Only really look at messages in the main guild
        if(reaction.message.guildId !== config?.discord.main_guild) return;
        // Check if the message is in a channel that is used for roles
        if(reaction.message.channelId === config?.discord.roles_channel) {
            switch(reaction.emoji.name) {
                case '🤖':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794634881859674');
                    break;
                case '❤️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794597401579571');
                    break;
                case '#️⃣':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794259386810388');
                    break;
                case '📝':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794629307650128');
                    break;
                case '⚖️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794631832604832');
                    break;
                case '📱':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794633099300864');
                    break;
                case '🖼️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794634206576721');
                    break;
                case '⌨️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794604691275856');
                    break;
                case '🦾':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040794626329694208');
                    break;
                case '🚸':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040805738907447316');
                    break;
                case '🔫':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040805750349512774');
                    break;
                case '🎉':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.add('1040805752866091091');
                    break;
            }
                
        }



    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (reaction.message.partial) await reaction.message.fetch();
        if (reaction.partial) await reaction.fetch();
        if (user.bot) return; // Ignore bot messages

        // Only really look at messages in the main guild
        if (reaction.message.guildId !== config?.discord.main_guild) return;

        // Check if the message is in a channel that is used for roles
        if (reaction.message.channelId === config?.discord.roles_channel) {
            switch (reaction.emoji.name) {
                case '🤖':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794634881859674');
                    break;
                case '❤️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794597401579571');
                    break;
                case '#️⃣':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794259386810388');
                    break;
                case '📝':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794629307650128');
                    break;
                case '⚖️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794631832604832');
                    break;
                case '📱':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794633099300864');
                    break;
                case '🖼️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794634206576721');
                    break;
                case '⌨️':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794604691275856');
                    break;
                case '🦾':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040794626329694208');
                    break;
                case '🚸':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040805738907447316');
                    break;
                case '🔫':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040805750349512774');
                    break;
                case '🎉':
                    await reaction.message.guild?.members.cache.get(user.id)?.roles.remove('1040805752866091091');
                    break;
            }

        }
    });
};