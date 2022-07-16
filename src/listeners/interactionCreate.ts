import { Commands } from "../Commands";
import { BaseCommandInteraction, ButtonInteraction, Client, Interaction, MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import buttonListener from "./buttonListener";
import commandListener from "./commandListener";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            await commandListener(client, interaction);
        }else if(interaction.isButton()){
            await buttonListener(client, interaction);
        }
    });
};