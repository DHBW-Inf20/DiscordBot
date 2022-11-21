import { kantinenInterface } from "../Bot";
import { Client, ButtonInteraction } from "discord.js";
import { nextPrevKantine, sendPreview } from '../commands/Kantine';
import stundenPlanMap from "../misc/stundenplanHandler";

export default async function buttonListener(client: Client, interaction: ButtonInteraction){
    let timeDelta = undefined;
    const interactionId = interaction.message.id;
    switch (interaction.customId) {
        case "previousWeek":
            if(!interactionId) return;
            stundenPlanMap.get(interactionId)?.previousWeek(interaction);
            break;
        case "nextWeek":
            if (!interactionId) return;
            stundenPlanMap.get(interactionId)?.nextWeek(interaction);
            break;
        case "today":
            nextPrevKantine( 0, interaction);
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

