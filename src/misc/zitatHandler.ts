import { client, config } from '../Bot';
import { CacheType, ContextMenuInteraction, ModalSubmitInteraction, TextChannel, MessageEmbed, User } from 'discord.js';
import { ScheduleWeek } from 'types/schedule';
interface zitatHandler {

    zitatSenden: (interaction: ModalSubmitInteraction, name?: string) => void;

    interaction: ContextMenuInteraction; // Initial Interaction
    content: string; // Content of the message
    user: User; // User of the message
    id: string; // ID of the message
    contextLink: string; // Link to the message
}

export default class ZitatHandler implements zitatHandler{
    interaction: ContextMenuInteraction;
    content: string;
    user: User;
    id: string;
    contextLink: string;

    constructor(interaction: ContextMenuInteraction, contextLink: string){
        this.interaction = interaction;
        this.contextLink = contextLink;
        this.content = interaction.options.get("message")!.message!.content;
        this.user = interaction.options.get("message")!.message!.author as User;
        this.id = interaction.options.get("message")!.message!.id;
    }

    zitatSenden = async (interaction: ModalSubmitInteraction,zitatAuthor?: string)  => {
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
        if(guild === null){
            console.error("Guild not found");
            return;
        }
        let zitateChannel = guild.channels!.cache.find(channel => channel.name === "zitate") as TextChannel;
        if(zitateChannel === undefined){
            console.error("Channel not found");
            const msg = await interaction.reply({content: "ein Zitate-channel wurde nicht gefunden, du musst zunächst einen Channel mit dem Namen \"zitate\" auf deinem Discord anlegen", ephemeral: true});
            return;
        }

        const msg = await zitateChannel.send(`${this.content} - ${zitatAuthor} ${this.contextLink}`);
        let embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`${this.content} - ${zitatAuthor}`)
            .setTimestamp()
            .setFooter({ text: "Gespeichert von: " + zitatSaver, iconURL: interaction.user.avatarURL()! });

        await interaction.reply({ embeds: [embed] });
        
    }



}