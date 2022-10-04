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

        const msg = await zitateChannel.send(`${this.content} - ${name}`);
        let embed = new MessageEmbed()
            .setTitle("Neues Zitat")
            .setURL(msg.url)
            .setDescription(`${this.content} - ${name}`)
            .setTimestamp()
            .setFooter({ text: "Gespeichert von: " + interaction.user.username, iconURL: interaction.user.avatarURL()! });

        const embedReply = await interaction.reply({ embeds: [embed] });

        dualisInterface.getSchedule().catch(async (err) => {
        console.error(err);
        }).then(async (schedule) => {   
            // Get current weekday
            let weekday = new Date().getDay();
            let day = (["sonntag","montag","dienstag","mittwoch","donnerstag","freitag","samstag"] as Array<keyof ScheduleWeek>)[weekday];
            let daySched = schedule?.schedule[day];
            let d = new Date();
            d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
            let currentLesson = daySched?.find((lesson) => {
                return +(lesson.from.split(":")[0]) <= new Date().getHours() && +(lesson.to.split(":")[0]) >= new Date().getHours();
            });
            let lessonName = currentLesson?.moduleName;

            if(lessonName){
                msg.edit(`${this.content} - ${name} (Währned der ${lessonName} Vorlesung)`);
            }else{
                msg.edit(`${this.content} - ${name}`);
            }
            
        });
        
    }



}