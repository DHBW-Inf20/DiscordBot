import { client, config } from '../Bot';
import { CacheType,  ContextMenuInteraction, ModalSubmitInteraction, TextChannel, MessageEmbed, User, MessageAttachment, Collection } from 'discord.js';
import { ScheduleWeek } from 'types/schedule';
import { Message } from 'discord.js';
interface zitatHandler {

    zitatSenden: (interaction: ModalSubmitInteraction, name?: string) => void;

    interaction: ContextMenuInteraction; // Initial Interaction
    content: string; // Content of the message
    user: User; // User of the message
    id: string; // ID of the message
    contextLink: string; // Link to the message
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

    zitatSenden = async (interaction: ModalSubmitInteraction, zitatAuthor?: string) => {
        zitatAuthor = zitatAuthor || this.user.username;
        let member = await interaction.guild?.members.fetch(this.user.id);
        if (member === null) {
            console.error("Member not found");
            return;
        }

        let zitatSaver = (await interaction.guild?.members.fetch(interaction.user.id))?.nickname || interaction.user.username;
        zitatAuthor = member?.nickname || member?.user.username || zitatAuthor;
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

        
        if(this.content !== "") {
            zitatEmbed.setDescription(this.content);
        }

        if (this.attachment.size > 0) {
            zitatEmbed.setImage(this.attachment.first()?.url || "");
        }

        // Check if the message has a reference
        if(this.referencedID) {
            let referencedMessage = await interaction.channel?.messages.fetch(this.referencedID);
            if(referencedMessage) {
            const referenceAuthor = referencedMessage.author;
            const referenceMember = await interaction.guild?.members.fetch(referenceAuthor.id);
            const referenceAuthorName = referenceMember?.nickname || referenceAuthor.username;
                zitatEmbed.addField("Antwort auf:", `[${referencedMessage.content} - ${referenceAuthorName}](${referencedMessage.url})`);
            }
        }


        const msg = await zitateChannel.send({ embeds: [zitatEmbed] });
        let embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`${this.content !== "" ? this.content : "[Einbettung]"} - ${zitatAuthor}`)
            .setTimestamp()
            .setFooter({ text: "Gespeichert von: " + zitatSaver, iconURL: interaction.user.avatarURL()! });

        await interaction.reply({ embeds: [embed] });

    }



}