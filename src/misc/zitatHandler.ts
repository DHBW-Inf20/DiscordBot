import {
    ContextMenuInteraction,
    ModalSubmitInteraction,
    TextChannel,
    MessageEmbed,
    User,
    MessageAttachment,
    Collection,
    MessageReaction,
    PartialMessage,
} from 'discord.js';
import { Message } from 'discord.js';
import dba from './databaseAdapter';
interface zitatHandler {

}

export class VoteZitatHandler implements zitatHandler {
    
    reaction: MessageReaction;
    user: User;
    message: Message<boolean> | PartialMessage;

   constructor(reaction: MessageReaction, user: User) {
        this.reaction = reaction;
        this.user = user;
        this.message = reaction.message;
    }

    async sendZitat() {
        if(this.message.partial) await this.message.fetch();

        let zitatAuthor = this.message.author?.username;
        let member = await this.reaction.message.guild?.members.fetch(this.user.id);
        if (member === null) {
            console.error("Member not found");
            return;
        }

        

        zitatAuthor = zitatAuthor || member?.nickname || member?.user.username || this.user.username;
        // get channel zitate from the guild
        const guild = this.message.guild;
        if (guild === null) {
            console.error("Guild not found");
            return;
        }
        let zitateChannel = guild.channels!.cache.find(channel => channel.name === "zitate") as TextChannel;
        if (zitateChannel === undefined) {
            return;
        }

        let contextLink = `https://discord.com/channels/${this.message.guildId}/${this.message.channelId}/${this.message.id}`;

        const zitatEmbed = new MessageEmbed()
            .setColor(member?.displayColor || "#000000")
            .setTitle(zitatAuthor)
            .setURL(contextLink)

        let liveQuote = false; // Wurde dieses Zitat nur ausgesprochen und in discord wieder aufgeschrieben, oder ist das ein Zitat aus Discord? (liveQuote z. B.: "lorem ipsum - i20029"). Autor ist i20029, nicht derjenige, der das Zitat aufgeschrieben hat.

        let content = this.message.content!;
        if (content !== "") {
            // Check if the message itself is a quote of some form
            const zitatSplit = content.split(" - ");
            // Check if the message is a quote and not just a normal message
            if (zitatSplit.length > 1) {
                // Delete all quote marks from the quote
                liveQuote = true;
                zitatSplit[0] = zitatSplit[0].replace(/"/g, "");
                content = zitatSplit[0];
                zitatAuthor = zitatSplit[1];
                zitatEmbed.setColor("#000000").setTitle(zitatAuthor);
            }
            zitatEmbed.setDescription(`"${content}"`);
        }

        if (!liveQuote && (this.message).attachments.size > 0) {
            zitatEmbed.setImage(this.message.attachments.first()?.url || "");
        }

        // Check if the message has a reference
        let referencedID = this.message.reference?.messageId;
        if (!liveQuote && referencedID) {
            let referencedMessage = await this.message.channel?.messages.fetch(referencedID);
            if (referencedMessage) {
                const referenceAuthor = referencedMessage.author;
                const referenceMember = await this.message.guild?.members.fetch(referenceAuthor.id);
                const referenceAuthorName = referenceMember?.nickname || referenceAuthor.username;
                zitatEmbed.addFields([{ name: `Antwort auf: `, value: `[${referencedMessage.content} - ${referenceAuthorName}](${referencedMessage.url})` }]);
            }
        }


        const msg = await zitateChannel.send({ embeds: [zitatEmbed] });
        let embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`"${content !== "" ? content : "[Einbettung]"}" - ${zitatAuthor}`)
            .setTimestamp()
        await this.message.channel.send({ embeds: [embed] });
        await dba.getInstance().addZitat(this.message.id, content, zitatAuthor, this.message.attachments.first()?.url);
    }

    
}

export default class ZitatHandler implements zitatHandler {
    interaction: ContextMenuInteraction;
    attachment: Collection<string, MessageAttachment>;
    content: string;
    user: User;
    id: string;
    contextLink: string;
    referencedID: string | undefined;

    constructor(interaction: ContextMenuInteraction, contextLink: string) {
        this.interaction = interaction;
        this.contextLink = contextLink;
        const message = interaction.options.get("message")!.message!;
        this.referencedID = ((message as Message).reference?.messageId);
        console.log(this.referencedID);
        this.content = message.content;
        this.attachment = message.attachments as Collection<string, MessageAttachment>;
        this.user = message.author as User;
        this.id = message.id;
        
    }

    zitatSenden = async (interaction: ModalSubmitInteraction, ownAuthor?: string) => {
        let zitatAuthor = ownAuthor;
        let member = await interaction.guild?.members.fetch(this.user.id);
        if (member === null) {
            console.error("Member not found");
            return;
        }

        let zitatSaver = (await interaction.guild?.members.fetch(interaction.user.id))?.nickname || interaction.user.username;
        zitatAuthor = zitatAuthor || member?.nickname || member?.user.username || this.user.username;
        // get channel zitate from the guild
        const guild = interaction.guild;
        if (guild === null) {
            console.error("Guild not found");
            return;
        }
        let zitateChannel = guild.channels!.cache.find(channel => channel.name === "zitate") as TextChannel;
        if (zitateChannel === undefined) {
            console.error("Channel not found");
            await interaction.reply({ content: "ein Zitate-channel wurde nicht gefunden, du musst zunächst einen Channel mit dem Namen \"zitate\" auf deinem Discord anlegen", ephemeral: true });
            return;
        }

        const zitatEmbed = new MessageEmbed()
            .setColor(member?.displayColor || "#000000")
            .setTitle(zitatAuthor)
            .setURL(this.contextLink)

        let liveQuote = false; // Wurde dieses Zitat nur ausgesprochen und in discord wieder aufgeschrieben, oder ist das ein Zitat aus Discord? (liveQuote z. B.: "lorem ipsum - i20029"). Autor ist i20029, nicht derjenige, der das Zitat aufgeschrieben hat.

        if(this.content !== "") {
            // Check if the message itself is a quote of some form
            const zitatSplit = this.content.split(" - ");
            // Check if the message is a quote and not just a normal message
            if (zitatSplit.length > 1) {
                // Delete all quote marks from the quote
                liveQuote = true;
                zitatSplit[0] = zitatSplit[0].replace(/"/g, "");
                this.content = zitatSplit[0];
                zitatAuthor = ownAuthor || zitatSplit[1];
                zitatEmbed.setColor("#000000").setTitle(zitatAuthor);
            }
            zitatEmbed.setDescription(`"${this.content}"`);
        }

        if (!liveQuote && this.attachment.size > 0) {
            zitatEmbed.setImage(this.attachment.first()?.url || "");
        }

        // Check if the message has a reference
        if(!liveQuote && this.referencedID) {
            let referencedMessage = await interaction.channel?.messages.fetch(this.referencedID);
            if(referencedMessage) {
            const referenceAuthor = referencedMessage.author;
            const referenceMember = await interaction.guild?.members.fetch(referenceAuthor.id);
            const referenceAuthorName = referenceMember?.nickname || referenceAuthor.username;
                zitatEmbed.addFields([{name: `Antwort auf: `, value: `[${referencedMessage.content} - ${referenceAuthorName}](${referencedMessage.url})`}]);
            }
        }


        const msg = await zitateChannel.send({ embeds: [zitatEmbed] });
        let embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`"${this.content !== "" ? this.content : "[Einbettung]"}" - ${zitatAuthor}`)
            .setTimestamp()
            .setFooter({ text: "Gespeichert von: " + zitatSaver, iconURL: interaction.user.avatarURL()! });
        await interaction.reply({ embeds: [embed] });

    }



}