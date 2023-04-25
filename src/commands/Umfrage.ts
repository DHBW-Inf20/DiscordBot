import { BaseCommandInteraction, Client, MessageSelectMenu } from 'discord.js';
import { Command } from "../types/command";






export const Umfrage: Command = {
    name: "umfrage",
    description: "Erstellt eine neue Umfrage (sendet ein Embed mit Reaktionen)",
    type: "CHAT_INPUT",
    options: [
        {
            name: "title",
            description: "Der Titel/Kernfrage der Umfrage",
            type: "STRING",
            required: true
        },
        {
            name: "description",
            description: "Die Beschreibung der Umfrage",
            type: "STRING",
            required: false
        },
        {
            name: "options",
            description: "Die Optionen der Umfrage (Mit Komma getrennt) [default: Ja, Nein]",
            type: "STRING",
            required: false
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        const title = interaction.options.get("title")?.value as string;
        const description = (interaction.options.get("description")?.value || '') as string;
        const optionsString = (interaction.options.get("options")?.value || 'Ja, Nein') as string;

        const options = optionsString.split(",").map((o) => o.trim());

        const select = new MessageSelectMenu()
            .setCustomId('umfrage-some')
            .setPlaceholder('Wähle eine Option')
            .addOptions(options.map((o,i) => ({ label: o, value: i.toString() })));

        const embed = {
            title: title,
            description: description,   
            color: 0x0099ff,
            timestamp: new Date(),
            fields: options.map((o,i) => ({ name: o, value: `0 Stimmen`, inline: true }))
        };

        interaction.reply({ embeds: [embed], components: [{ type: 'ACTION_ROW', components: [select] }] });


    }
};

