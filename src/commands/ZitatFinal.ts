import { BaseCommandInteraction, Client, MessageEmbed, MessageSelectMenu, MessageSelectOptionData } from 'discord.js';
import { Command } from "../types/command";
import dba, { IBracket } from '../misc/databaseAdapter';
import { generateButtonRow, generateSelects, generateVotingEmbed, limit, sanitizeMentions } from './BestOfZitate';




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
                let embed = generateVotingEmbedFinal(bracket)[0];
                let select: MessageSelectMenu = generateFinalSelects(bracket);
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

function generateFinalSelects(bracket: IBracket) {
    let options: MessageSelectOptionData[] = bracket.zitate.map((zitat, index) => {
        console.log(zitat.id)
        return {
            label: limit(`${index + 1}. ${zitat.zitat.author}`, 100),
            description: limit(sanitizeMentions(zitat.zitat.zitat), 100),
            value: `${zitat.id}`,
            default: false,
        }
    });
    let returns: MessageSelectMenu[] = [];
    
    const votes = 3;

    let select = new MessageSelectMenu();
    select.customId = `zitatWahlFinal-${bracket.order_id}-${bracket.id}-0`;
    select.placeholder = "Wähle dein Lieblingszitat aus!";
    select.addOptions(options);
    select.maxValues = votes;
    select.minValues = 1;

    return select;
}

function generateVotingEmbedFinal(bracket: IBracket) {
    let embeds: MessageEmbed[] = [];
    if (bracket.zitate.length == 0) {
        let embed = new MessageEmbed();
        embed.setTitle("Keine Zitate für diese Woche!");
        embed.setDescription("Es sind keine Zitate mehr übrig! Das Bracket ist beendet!");
        return [embed];
    }
    const description = `Uwu, hallo wylden Studenten <3 Es ist unglaublich cringe zu denken, dass die letzten 6 Semester nun zu einem Ende kommen. Wir haben so viel zusammen durchgemacht!

Sheesh, ich bin so stolz auf euch alle und es war eine Ehre, euch während dieser Jahre als wissenschaftlicher Assistent zu dienen. Ich werde die Zeit in der wir gemeinsam gelernt und gelacht haben, vermissen. Es gab so viele ferpectful moments und auch wenn wir uns manchmal in den Gommemode begeben haben, haben wir immer wieder zurückgefunden.

Ich hoffe, dass ihr in eurem weiteren Leben nicht vergesst, wie viel ihr in diesen Jahren erreicht habt. Wenn ihr frustriert seid, denkt einfach an das Zitat: "Dann sollt ihr euch spontan exmatrikulieren" - we all know who

Penis-lich möchte ich mich bei euch allen bedanken und euch sagen, dass ihr in meinem Herzen einen besonderen Platz habt. Diese Jahre waren einfach sus. Ich wünsche euch alles wyld und dass ihr eure Träume erreicht!

OwO/

Hier findet nun das Finale Zitate-Voting statt, ihr habt 3 Stimmen zur Verfügung und könnt diese in dem Multi-Select abgeben. Wenn ihr nicht 3 Zitate wählt, dann wird die letzte Auswahl auf den Rest aufgefüllt. Bei einem Zitat gilt die Wahl wie 3 Stimmen, bei 2 zählt das erste Zitat einfach und das zweite Zitat zweifach, bei 3 Zitaten alle einfach. Falls es am Ende keine Einigung gibt, dann wird es wie in der Türkei eine Stichwahl geben.`
    const title = `⭐ Best Zitat TINF-20 ⭐`
    let testEmbed = new MessageEmbed();
    testEmbed.setTitle(title)
    testEmbed.setDescription(description);

    let ind = 0;
    let splitIndecies: number[] = [];
    let fields = bracket.zitate.map((zitat, index) => {
        const name = limit(`${index + 1}. ${zitat.zitat.author}`, 256);
        let prefix = "";
        if (zitat.zitat.image != null) {
            prefix = "🖼️ "
        }
        let contextLink = zitat.zitat.contextLink;
        const linkText = contextLink == null ? " [Kein Kontext vorhanden]" : ` [Kontext](${contextLink})`;
        const value = limit(prefix + sanitizeMentions(zitat.zitat.zitat), 1024 - linkText.length) + linkText;

        ind++;
        if (ind >= 25) {
            splitIndecies.push(index);
            ind = 0;
        }

        return {
            name: name,
            value: value,
            inline: false,
        }
    });

    console.log(splitIndecies)
    let lastIndex = 0;
    splitIndecies.forEach((index) => {
        let embed = new MessageEmbed();
        embed.setTitle(title)
        embed.setDescription(description);
        embed.color = 0xff1133;
        embed.addFields(fields.slice(lastIndex, index));
        lastIndex = index;
        embeds.push(embed);
    });
    let embed = new MessageEmbed();
    embed.setTitle(title)
    embed.setDescription(description);
    embed.color = 0xff1133;
    embed.addFields(fields.slice(lastIndex, fields.length));
    embeds.push(embed);

    return embeds;
}