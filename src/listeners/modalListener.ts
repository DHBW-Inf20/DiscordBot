import { Client, ModalSubmitInteraction } from 'discord.js';
import { zitateMap } from '../Bot';

export default async function modalListener(client: Client, interaction: ModalSubmitInteraction){
   
    switch(interaction.customId){
        //Static ids
        default:
            if (interaction.customId.startsWith("zitatModal_")){
                zitateMap[interaction.customId.split("_")[1]].zitatSenden(interaction,interaction.fields.getTextInputValue("name"))
                delete zitateMap[interaction.customId.split("_")[1]];
            }
    }

};
