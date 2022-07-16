import { BaseCommandInteraction, ChatInputApplicationCommandData, Client, ContextMenuInteraction, MessageApplicationCommandData } from "discord.js";

export interface Command extends ChatInputApplicationCommandData {
    run: (client: Client, interaction: BaseCommandInteraction) => void;
}

export interface ContextMenuCommand extends MessageApplicationCommandData {
    run: (client: Client, interaction: ContextMenuInteraction) => void;
}