import { Client, ButtonInteraction, SelectMenuInteraction, Message } from "discord.js";
import ZitatWahl from "../misc/zitatWahl";
export const umfrageMap = new Map<string, Map<string, Set<string>>>();

export default async function selectListener(client: Client, interaction: SelectMenuInteraction){
    
    let selectId = interaction.customId.split("-")[0];
    let nextId = interaction.customId.split("-").slice(1) || '';

    let message = interaction.message as Message;
    const msgId = message.id;
    const user = interaction.user;
    const userId = user.id;

    console.log(selectId, nextId, msgId, userId)
    
    switch (selectId) {
        case "umfrage":
            let selectedValue = interaction.values[0];
            if (!umfrageMap.has(msgId)) {
                umfrageMap.set(msgId, new Map<string, Set<string>>());
                umfrageMap.get(msgId)!.set(selectedValue, new Set<string>());
            }
            if (!umfrageMap.get(msgId)!.has(selectedValue)) {
                umfrageMap.get(msgId)!.set(selectedValue, new Set<string>());
            }
            umfrageMap.get(msgId)!.get(selectedValue)!.add(userId);

            let embed = message.embeds[0];
            let selectedLabel = embed.fields[+selectedValue]?.name || '';
            umfrageMap.get(msgId)!.forEach((value, key) => {

                if (key === selectedValue) return;

                if (value.has(userId)) {
                    value.delete(userId);
                }

            });
            
            embed.fields = embed.fields.map((field, index) => {
                return { name: field.name, value: `${umfrageMap.get(msgId)!.get(index.toString())?.size || 0} Stimmen`, inline: true };
            });



            await message.edit({ embeds: [embed] });
            await interaction.reply({ content: `Du hast für ${selectedLabel} abgestimmt!`, ephemeral: true });
    // await interaction.deferUpdate();

            return;
        case "zitatWahl":

            console.log(nextId)
            const order_id = +nextId[0];
            const bracket_id = +nextId[1];
            let zw = new ZitatWahl(interaction, order_id, bracket_id, [+interaction.values[0]]);
            await zw.handleSelect();
            return;
        case "zitatWahlFinal":
            console.log(nextId)
            const _order_id = +nextId[0];
            const _bracket_id = +nextId[1];
            let ids = [];
            if(interaction.values.length == 1){
                ids = [+interaction.values[0], +interaction.values[0], +interaction.values[0]];
            }else if(interaction.values.length == 2){
                ids = [+interaction.values[0], +interaction.values[1], +interaction.values[1]];
            }else{
                ids = [+interaction.values[0], +interaction.values[1], +interaction.values[2]];
            }
            let _zw = new ZitatWahl(interaction, _order_id, _bracket_id, ids);
            await _zw.handleSelect();
            return;
        default:
            return;
    }
}

