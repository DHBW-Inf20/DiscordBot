import { dualis } from "../Bot";
import { nextPrevSched } from "../commands/Stundenplan";
import { Client, ButtonInteraction } from "discord.js";

export default async function buttonListener(client: Client, interaction: ButtonInteraction){
    let weekDelta = undefined;
    switch (interaction.customId) {
        case "previousWeek":
            weekDelta = -1;
        case "nextWeek":
            interaction.deferReply();
            weekDelta = weekDelta || 1;
            nextPrevSched((dualis.lastN || 0) + weekDelta, interaction);
            break;
    }
}