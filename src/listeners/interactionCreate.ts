import { Client, Interaction } from "discord.js";
import buttonListener from "./buttonListener";
import commandListener from "./commandListener";
import modalListener from "./modalListener";
import selectListener from "./selectListener";

export default (client: Client): void => {
    client.on("interactionCreate", async (interaction: Interaction) => {
        if (interaction.isCommand() || interaction.isContextMenu()) {
            await commandListener(client, interaction);
        }else if(interaction.isButton()){
            await buttonListener(client, interaction);
        }else if(interaction.isModalSubmit()){
            modalListener(client, interaction);
        }else if(interaction.isSelectMenu()){
            selectListener(client, interaction);
        }
    });
};