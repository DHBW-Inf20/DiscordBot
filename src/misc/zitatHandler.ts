import { client, config } from '../Bot';
import { CacheType, ContextMenuInteraction, ModalSubmitInteraction, TextChannel, MessageEmbed } from 'discord.js';
interface zitatHandler {

    zitatSenden: (interaction: ModalSubmitInteraction, name?: string) => void;

    interaction: ContextMenuInteraction; // Initial Interaction
    content: string; // Content of the message
    user: string; // User of the message
    id: string; // ID of the message
}

export default class ZitatHandler implements zitatHandler{
    interaction: ContextMenuInteraction;
    content: string;
    user: string;
    id: string;

    constructor(interaction: ContextMenuInteraction){
        this.interaction = interaction;
        this.content = interaction.options.get("message")!.message!.content;
        this.user = interaction.options.get("message")!.message!.author.username;
        this.id = interaction.options.get("message")!.message!.id;
    }

    zitatSenden = async (interaction: ModalSubmitInteraction,name?: string)  => {
        name = name || this.user;
        let zitateChannel = await client.channels.fetch(config!.discord.zitate_channel) as TextChannel;

        const msg = await zitateChannel.send(`${this.content} - ${name}`);
        
        const embed = new MessageEmbed()
        .setTitle("Neues Zitat")
        .setURL(msg.url)
        .setDescription(`${this.content} - ${name}`)
        .setTimestamp()
        .setFooter({ text: "Gespeichert von: " +interaction.user.username, iconURL: interaction.user.avatarURL()!});

        interaction.reply({ embeds: [embed] });
    }



}