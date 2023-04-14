import {
    Client,
    BaseCommandInteraction,
    Modal,
    MessageActionRow,
    TextInputComponent,
    ModalActionRowComponent,
} from 'discord.js';
import { Command } from '../types/command';
import { chatHistory } from './Ask';
import dba from '../misc/databaseAdapter';



export const Session: Command = {
    name: "session",
    description: "Resettet die Chat-Session-History",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Open the file neske.txt
        let user = interaction.user;
        chatHistory[user.id] = [];
        await interaction.reply({ content: `Chat-Session wurde resettet`, ephemeral: true});
    }
};

export const AddPrompt: Command = {
    name: "addprompt",
    description: "Fügt einen neuen Prompt hinzu",
    options: [
        {
            name: "name",
            description: "Name des Prompts (vorhandene werden überschrieben)",
            type: "STRING",
            required: true,
        },
        {
            name: "prompt",
            description: "Der Prompt",
            type: "STRING",
            required: true,
        },
        {
            name: "changeself",
            description: "Ändert die eigene Prompt zu diesem Prompt (default: true)",
            type: "BOOLEAN",
            required: false,
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        const name = (interaction.options.get("name")?.value || "Horby") as string;
        const prompt = interaction.options.get("prompt") as string | null;
        if (prompt === null){
            await interaction.reply({ content: `Prompt darf nicht leer sein`, ephemeral: true});
            return;
        }
        const changeself = (interaction.options.get("changeself") || true) as boolean;    
        dba.getInstance().setNameBasedPrompt(name, prompt);
        if (changeself) {
            dba.getInstance().setUserBasedPrompt(interaction.user.id, name);
        }
        await interaction.reply({ content: `Prompt wurde hinzugefügt`, ephemeral: true});
    }
}


export const SetPrompt: Command = {
    name: "setprompt",
    description: "Setzt die eigene Prompt",
    options: [
        {
            name: "name",
            description: "Name des Prompts (kann mit listprompts aufgelistet werden)",
            type: "STRING",
            required: true,
        },
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        const name = (interaction.options.get("name")?.value || "Horby") as string;
        try{
            dba.getInstance().setUserBasedPrompt(interaction.user.id, name);
        }catch(e){
            await interaction.reply({ content: `Prompt nicht gefunden`, ephemeral: true});
            return;
        }
        await interaction.reply({ content: `Prompt wurde auf ${name} gesetzt`, ephemeral: true});    
    }
}

export const ListPrompts: Command = {
    name: "listprompts",
    description: "Listet alle verfügbaren Prompts auf",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        let rtString = dba.getInstance().listPrompts();
        await interaction.reply({ content: `Verfügbare Prompts: ${rtString}`, ephemeral: true});
    }
}

