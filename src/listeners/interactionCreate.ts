import { Commands } from "../Commands";
import { BaseCommandInteraction, ButtonInteraction, Client, Interaction, MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import { dualis } from "../Bot";
import { randomUUID } from "crypto";
import { StundenplanCanvas } from "../misc/stundenplanCanvas";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            await handleSlashCommand(client, interaction);
        }else if(interaction.isButton()){
            await handleButtonClick(client, interaction);
        }
    });
};

const handleSlashCommand = async (client: Client, interaction: BaseCommandInteraction): Promise<void> => {
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: "An error has occurred" });
        return;
    }

    slashCommand.run(client, interaction);
};

const handleButtonClick = async (client: Client, interaction: ButtonInteraction): Promise<void> => {

    switch(interaction.customId){
        case "previousWeek":
            const row = new MessageActionRow().addComponents([
                new MessageButton().setCustomId('previousWeek').setLabel('<< Vorherige Woche').setStyle('SECONDARY'),
                new MessageButton().setCustomId('nextWeek').setLabel('Nächste Woche >>').setStyle('SECONDARY')
            ])
            interaction.deferReply();
            dualis.getSchedule((dualis.lastN || 0) - 1).catch(async err => {
                console.error(err);
                await interaction.editReply({
                    content: "Fehler beim Abrufen des Stundenplans",
                    components: [row],

                });
            }).then(async schedule => {
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
            }).catch(async err => {
                console.error(err);
                await interaction.editReply({
                    content: "Fehler beim Erstellen des Stundenplans",
                    components: [row]

                });
            });
            break;
        case "nextWeek":
            dualis.getSchedule((dualis.lastN || 0) + 1).catch(async err => {
                console.error(err);
                await interaction.editReply({
                    content: "Fehler beim Abrufen des Stundenplans",
                    components: [row],

                });
            }).then(async schedule => {
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
            }).catch(async err => {
                console.error(err);
                await interaction.editReply({
                    content: "Fehler beim Erstellen des Stundenplans",
                    components: [row]
                });
            });
            break;
    }
}