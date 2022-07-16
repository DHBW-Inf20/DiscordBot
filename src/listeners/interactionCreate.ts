import { Commands } from "../Commands";
import { BaseCommandInteraction, ButtonInteraction, Client, Interaction, MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import { dualis } from "../Bot";
import { randomUUID } from "crypto";
import { StundenplanCanvas } from "../misc/stundenplanCanvas";
import { nextPrevSched } from '../commands/Stundenplan';

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
    let weekDelta = undefined;
    switch(interaction.customId){
        case "previousWeek":
           weekDelta = -1;
        case "nextWeek":
            interaction.deferReply();
            weekDelta = weekDelta || 1;
            nextPrevSched((dualis.lastN || 0) + weekDelta, interaction);
            break;
    }
}

