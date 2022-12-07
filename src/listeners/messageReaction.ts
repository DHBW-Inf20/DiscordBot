
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

        // Check if the message is in a channel that is used for roles
        if(reaction.message.channelId === config?.discord.roles_channel) {
            const member = reaction.message.guild?.members.cache.get(user.id);
            if(!member) return;
            if(member.partial) await member.fetch();
            await addRole(member, reaction.emoji.name, reaction.emoji.id);
            return;   
        }

        if(config?.debug){   
            console.log(`Reaction added: <${reaction.emoji.animated}:${reaction.emoji.name}:${reaction.emoji.id}> by ${user.username} in ${reaction.message.channelId}`);
        }
        if (reaction.emoji.name === '⭐' ){
            if(config?.debug){
                console.log(`Reaction with Star registered!`)
            }
            if((reaction.count || 0) >= 4){
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
            if (member.partial) await member.fetch();
            await removeRole(member ,reaction.emoji.name, reaction.emoji.id);
        }
    });
};



async function addRole(member: GuildMember, emoji: string | null, emojiId: string | null) {
    const role = emoteToRole(emoji, emojiId);
    if (role) {
       await member.roles.add(role);
    }
}

async function removeRole(member: GuildMember, emoji: string | null, emojiId: string | null) {
    const role = emoteToRole(emoji, emojiId);
    if (role) {
       await member.roles.remove(role);
    }
}


function emoteToRole(emojiName: string | null, emojiId: string | null) {
    switch (emojiName) {
        case '🤖':
            return ('1040794634881859674');
        case '❤️':
            return ('1040794597401579571');
        case '#️⃣':
            return ('1040794259386810388');
        case '📝':
            return ('1040794629307650128');
        case '⚖️':
            return ('1040794631832604832');
        case '📱':
            return ('1040794633099300864');
        case '🖼️':
            return ('1040794634206576721');
        case '⌨️':
            return ('1040794604691275856');
        case '🦾':
            return ('1040794626329694208');
        case '🚸':
            return ('1040805738907447316');
        case '🔫':
            return ('1040805750349512774');
        case '🎉':
            return ('1040805752866091091');
    }

    switch (emojiId) {
        case '941482275693010974':
            if (emojiName === 'leagueoflegends') return ('1049974593567330305');
            break;
        case '843766809416171521':
            if (emojiName === 'minecraft') return ('1040984491755323402');
            break;
        case '873216132914479165':
            if (emojiName === "ApexLegends") return ('1049976189520982087')
            break;
    }
    return null;
}