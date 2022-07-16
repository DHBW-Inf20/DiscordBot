import { dualisInterface, kantinenInterface } from "../Bot";
import { nextPrevSched } from "../commands/Stundenplan";
import { Client, ButtonInteraction } from "discord.js";
import { nextPrevKantine, sendPreview } from '../commands/Kantine';

export default async function buttonListener(client: Client, interaction: ButtonInteraction){
    let timeDelta = undefined;
    switch (interaction.customId) {
        case "previousWeek":
            timeDelta = -1;
        case "nextWeek":
            interaction.deferReply();
            timeDelta = timeDelta || 1;
            nextPrevSched((dualisInterface.lastN || 0) + timeDelta, interaction);
            break;
        case "previousDay":
            timeDelta = -1;
        case "nextDay":
            timeDelta = timeDelta || 1;
            nextPrevKantine((kantinenInterface.lastDay || 0) + timeDelta, interaction);
        default:
            // Not a static Button
            // Check if its a preview for the kantine Action
            if (interaction.customId.startsWith("kantinePreview_")) {
                sendPreview(interaction.customId.split("_")[1], interaction);
            }
    }
}

