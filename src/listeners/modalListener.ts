import { Client, ModalSubmitInteraction } from 'discord.js';
import { zitateMap } from '../Bot';
import { verifyMap } from './../Bot';

export default async function modalListener(client: Client, interaction: ModalSubmitInteraction){
   
    switch(interaction.customId){
        //Static ids
        default:
            if (interaction.customId.startsWith("zitatModal_")){
                zitateMap[interaction.customId.split("_")[1]].zitatSenden(interaction,interaction.fields.getTextInputValue("name"))
                delete zitateMap[interaction.customId.split("_")[1]];
            } else if (interaction.customId.startsWith("verifyModal_")){
                verifyMap[interaction.customId.split("_")[1]].check(interaction,interaction.fields.getTextInputValue("id"))
            }
    }

};
