import { dualis } from "../Bot";
import { BaseCommandInteraction, ButtonInteraction, Client, Message, MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import { Command } from "../types/command";
import { StundenplanCanvas } from '../misc/stundenplanCanvas';
import { randomUUID } from "crypto";

// Globally used constants by this command-Family
const row = new MessageActionRow().addComponents([
    new MessageButton().setCustomId('previousWeek').setLabel('<< Vorherige Woche').setStyle('SECONDARY'),
    new MessageButton().setCustomId('nextWeek').setLabel('Nächste Woche >>').setStyle('SECONDARY')
])

export const Stundenplan: Command = {
    name: "stundenplan",
    description: "Zeigt einen Stundenplan an",
    type: "CHAT_INPUT",
    options: [
        {
            name: "woche",
            description: "Welche Woche soll angezeigt werden? (n viele Wochen in die Zukunft)",
            type: "INTEGER",
            required: false
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {     
        let weekParameter:number|undefined = (interaction.options.get("woche")?.value as number | undefined);
        if(weekParameter === undefined) weekParameter = 0;

        await interaction.deferReply();
        nextPrevSched(weekParameter, interaction);
    }
};


export function nextPrevSched(weekN: number, interaction: ButtonInteraction | BaseCommandInteraction) {
    dualis.getSchedule(weekN).catch(async (err) => {
        console.error(err);
        await interaction.editReply({
            content: "Fehler beim Abrufen des Stundenplans",
            components: [row],
        });
    }).then(async (schedule) => {
        if (schedule === undefined) {
            await interaction.editReply({
                content: "Fehler beim Abrufen des Stundenplans",
                components: [row]
            });
            return;
        } else if (Object.keys(schedule.schedule).length === 0) {
            // If the schedule is empty, display a gif instead (no schedule this week)
            await interaction.editReply({
                content: "https://tenor.com/view/free-dave-chappelle-celebrate-finally-freedom-gif-4581850",
                components: [row]
            });
            return;
        }
        let spC = new StundenplanCanvas(schedule.schedule, schedule.meta.kw, schedule.meta.year);
        spC.renderCanvas();
        let attachment = new MessageAttachment(spC.getBuffer(), "stundenplan.png");
        // create uuid
        attachment.id = randomUUID();
        await interaction.editReply({
            files: [attachment],
            components: [row]
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.editReply({
            content: "Fehler beim Erstellen des Stundenplans",
            components: [row]
        });
    });
}
