import {
    BaseCommandInteraction,
    ButtonInteraction,
    Client,
    MessageActionRow,
    MessageAttachment,
    MessageButton,
} from "discord.js";
import { Command } from "../types/command";
import { StundenplanCanvas } from '../misc/stundenplanCanvas';
import { randomUUID } from "crypto";
import { Intranet } from './../interfaces/horbintranet';
import dba from './../misc/databaseAdapter';

// Globally used constants by this command-Family
const constantButtonRow = new MessageActionRow().addComponents([
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
        await nextPrevSched(weekParameter, interaction);
    }
};


export async function nextPrevSched(weekN: number, interaction: ButtonInteraction | BaseCommandInteraction) {

    // Generate the right kurs-string
    let dbUser = await dba.getInstance().getUser(interaction.user.id);
    if(!dbUser) {    
        await interaction.editReply("Dein Discord-Account ist noch nicht verifiziert und es fehlt eine Kurs-Zuordnung. Bitte verifiziere deinen Account mit dem Befehl `/verify <ixxxx>` und versuche es erneut.");
        return;
    }
    let kurs = "HOR-T"+dbUser.course;
    Intranet.getInstance().getStundenplan(kurs,weekN).catch(async (err) => {
        console.error(err);
        await interaction.editReply({
            content: "Fehler beim Abrufen des Stundenplans",
            components: [constantButtonRow],
        });
    }).then(async (schedule) => {
        if (schedule === undefined) {
            await interaction.editReply({
                content: "Fehler beim Abrufen des Stundenplans",
                components: [constantButtonRow]
            });
            return;
        } else if (Object.keys(schedule.schedule).length === 0) {
            // If the schedule is empty, display a gif instead (no schedule this week)
            await interaction.editReply({
                content: "https://tenor.com/view/free-dave-chappelle-celebrate-finally-freedom-gif-4581850",
                components: [constantButtonRow]
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
            components: [constantButtonRow]
        });
    }).catch(async (err) => {
        console.error(err);
        await interaction.editReply({
            content: "Fehler beim Erstellen des Stundenplans",
            components: [constantButtonRow]
        });
    });
}
