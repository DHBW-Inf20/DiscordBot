import { BaseCommandInteraction, Client, MessageSelectMenu } from 'discord.js';
import { Command } from "../types/command";
import dba from '../misc/databaseAdapter';
import { generateButtonRow, generateSelects, generateVotingEmbed } from './BestOfZitate';




export const FinalZitate: Command = {
    name: "zitatfinal",
    description: "Initiert das finale Zitatevoting",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({ ephemeral: true });
        if (interaction.user.id != '902550033084346378') {
            await interaction.followUp({ content: `Ich will nicht den Autokraten spielen, aber ein wenig die Wahl moderieren. Deshalb darfst du den Command nicht ausführen :(.`, ephemeral: true });
            return;
        }

        const channel = interaction.channel;

        try{
            let bracket = await dba.getInstance().getCurrentFinalBracket();

            if(bracket == null){
                await interaction.followUp({ content: `Es ist kein finales Bracket gefunden`, ephemeral: true });
                return;
            }

            if(bracket.winner != null){
                // Send the winner-message and end the voting!
            }else{
                
                console.log(bracket, bracket.zitate)
                let embed = generateVotingEmbed(bracket)[0];
                let select: MessageSelectMenu = generateSelects(bracket)[0];
                let buttonRow = generateButtonRow(bracket);

                console.log(embed.fields.length, select.options.length, buttonRow.components.length);

                if(buttonRow.components.length > 0){

                    await channel?.send({ embeds: [embed], components: [buttonRow, { type: 'ACTION_ROW', components: [select] }] });

                }else{

                    await channel?.send({ embeds: [embed], components: [{ type: 'ACTION_ROW', components: [select] }] });

                }



            }






        }catch (e) {
            await interaction.followUp({ content: `Es ist ein Fehler aufgetreten: ${e}`, ephemeral: true });
            console.error(e);
            return;
        }
    }

};
