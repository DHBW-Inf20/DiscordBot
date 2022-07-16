import { Commands } from "../Commands";
import { Client, BaseCommandInteraction, ContextMenuInteraction } from 'discord.js';
import { Command, ContextMenuCommand } from '../types/command';

export default async function commandListener(client: Client, interaction: BaseCommandInteraction | ContextMenuInteraction){
    const slashCommand = Commands.find(c => c.name === interaction.commandName);
    if (!slashCommand) {
        interaction.followUp({ content: "An error has occurred" });
        return;
    }

    if(interaction.isContextMenu()){
        (slashCommand as ContextMenuCommand).run(client, interaction);
    }else{
        (slashCommand as Command).run(client, interaction as BaseCommandInteraction);
    }
};
