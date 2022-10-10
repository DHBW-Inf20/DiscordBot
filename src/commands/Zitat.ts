import { zitateMap } from '../Bot';
import { Client, BaseCommandInteraction, ContextMenuInteraction, Modal, MessageActionRow, TextInputComponent, ModalActionRowComponent } from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import {  ContextMenuCommand } from "../types/command";

export const Zitat: ContextMenuCommand = {
    name: "Zitat speichern",
    type: "MESSAGE",
    run: async (client: Client, interaction: ContextMenuInteraction) => {
        let content = interaction.options.get("message")?.message?.content;
        let user = interaction.options.get("message")?.message?.author.username;
        // await interaction.deferReply();

        if(!interaction.options.get("message")?.message){
            await interaction.followUp({ content: "Es konnte keine Nachricht erkannt werden!" });
            return;
        }
        const modal = new Modal()
            .setCustomId('zitatModal_'+interaction.options.get("message")?.message?.id)
            .setTitle('Neues Zitat erstellen');
        
        const guildID = interaction.guildId;
        const channelID = interaction.channelId;
        const messageID = interaction.options.get("message")?.message?.id;
        const contextLink = `https://discord.com/channels/${guildID}/${channelID}/${messageID}`;
        const zitat = new ZitatHandler(interaction, contextLink);
        zitateMap[interaction.options.get("message")!.message!.id] = zitat;
        // Add components to modal
        // Create the text input components
        const NameInput = new TextInputComponent()
            .setCustomId('name')
            .setLabel("Anzeigename (optional: default ist Username)")
            .setRequired(false)
            .setStyle('SHORT');
        const firstActionRow = new MessageActionRow<ModalActionRowComponent>().addComponents(NameInput);
        // Add inputs to the modal
        modal.addComponents(firstActionRow);
        // Show the modal to the user
        await interaction.showModal(modal);
        console.log(content, user);
    }
};