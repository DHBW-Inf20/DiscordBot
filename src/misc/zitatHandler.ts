import { client, config, dualisInterface } from '../Bot';
import { CacheType, ContextMenuInteraction, ModalSubmitInteraction, TextChannel, MessageEmbed } from 'discord.js';
import { ScheduleWeek } from 'types/dualis';
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

            dualisInterface.getSchedule().catch(async (err) => {
            console.error("Fehler beim Studneplan aufrufen in der Zitaterstellung " + err );
            const msg = await zitateChannel.send(`${this.content} - ${name}`);
            const embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`${this.content} - ${name}`)
            .setTimestamp()
            .setFooter({ text: "Gespeichert von: " +interaction.user.username, iconURL: interaction.user.avatarURL()!});
    
            interaction.reply({ embeds: [embed] });
        }).then(async (schedule) => {
            // Get current weekday
            let weekday = new Date().getDay();
            let day = (["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"] as Array<keyof ScheduleWeek>)[weekday];
            let daySched = schedule?.schedule[day];
            let currentLesson = daySched?.find((lesson) => {
                return new Date(lesson.from).getHours() <= new Date().getHours() && new Date(lesson.to).getHours() >= new Date().getHours();
            });
            let lessonName = currentLesson?.moduleName;

            if(lessonName){
                const msg = await zitateChannel.send(`${this.content} - ${name} (Währned der ${lessonName} Vorlesung`);
                const embed = new MessageEmbed()
                .setTitle("Neues Zitat")
                .setURL(msg.url)
                .setDescription(`${this.content} - ${name}`)
                .setTimestamp()
                .setFooter({ text: "Gespeichert von: " +interaction.user.username, iconURL: interaction.user.avatarURL()!});
    
                interaction.reply({ embeds: [embed] });
            }else{
                const msg = await zitateChannel.send(`${this.content} - ${name}`);
                const embed = new MessageEmbed()
                .setTitle("Neues Zitat")
                .setURL(msg.url)
                .setDescription(`${this.content} - ${name}`)
                .setTimestamp()
                .setFooter({ text: "Gespeichert von: " + interaction.user.username, iconURL: interaction.user.avatarURL()! });
                interaction.reply({ embeds: [embed] });
            }
            
        });
        
    }



}