
import { Client, Collection, GuildMember, MessageReaction, Role, RoleResolvable, User } from 'discord.js';
import { VoteZitatHandler } from './../misc/zitatHandler';
import { config } from '../Bot';
import dba from './../misc/databaseAdapter';




export default (client: Client): void => {

    

    client.on('messageReactionAdd', async (reaction, user) => {
        if(reaction.message.partial) await reaction.message.fetch();
        if(reaction.partial) await reaction.fetch();
        if(user.partial) await user.fetch();
        if(user.bot) return; // Ignore bot messages

        // Only really look at messages in the main guild
        if(reaction.message.guildId !== config?.discord.main_guild) return;
        // Check if the message is in a channel that is used for roles
        if(reaction.message.channelId === config?.discord.roles_channel) {
            const member = reaction.message.guild?.members.cache.get(user.id);
            if(!member) return;
            const f = member.roles.add;
            await toggleRole(f, reaction.emoji.name);     
            return;   
        }

        console.log(`Reaction added: ${reaction.emoji.name} by ${user.username} in ${reaction.message.channelId}`);
        if (reaction.emoji.name === '⭐' ){
            if(config?.debug){
                console.log(`Reaction with Star registered!`)
            }
            if((reaction.count || 0) >= 1){
                // Check if it already exists
                console.log(`Reaction with star reached over 4!`)
                if(await dba.getInstance().zitatExists(reaction.message.id)) {
                    console.log(`Reaction with star reached over 4 and already exists!`)
                    return;
                }

                // Add the zitat
                const zitat = new VoteZitatHandler(reaction as MessageReaction, user as User);
                zitat.sendZitat();
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
            const member = reaction.message.guild?.members.cache.get(user.id);
            if (!member) return;
            const f = member.roles.remove;
            toggleRole(f ,reaction.emoji.name);
        }
    });
};



async function toggleRole(toggleFunction : (roleOrRoles: RoleResolvable | readonly RoleResolvable[] | Collection<string, Role>, reason?: string | undefined) => Promise<GuildMember>, emoji: string | null) {
    switch (emoji) {
        case '🤖':
            await toggleFunction('1040794634881859674');
            break;
        case '❤️':
            await toggleFunction('1040794597401579571');
            break;
        case '#️⃣':
            await toggleFunction('1040794259386810388');
            break;
        case '📝':
            await toggleFunction('1040794629307650128');
            break;
        case '⚖️':
            await toggleFunction('1040794631832604832');
            break;
        case '📱':
            await toggleFunction('1040794633099300864');
            break;
        case '🖼️':
            await toggleFunction('1040794634206576721');
            break;
        case '⌨️':
            await toggleFunction('1040794604691275856');
            break;
        case '🦾':
            await toggleFunction('1040794626329694208');
            break;
        case '🚸':
            await toggleFunction('1040805738907447316');
            break;
        case '🔫':
            await toggleFunction('1040805750349512774');
            break;
        case '🎉':
            await toggleFunction('1040805752866091091');
            break;
    }
}