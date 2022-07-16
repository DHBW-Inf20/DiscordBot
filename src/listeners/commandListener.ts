import { Commands } from "../Commands";
import { Client, BaseCommandInteraction } from "discord.js";

export default async function commandListener(client: Client, interaction: BaseCommandInteraction){
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: "An error has occurred" });
        return;
    }

    slashCommand.run(client, interaction);
};
