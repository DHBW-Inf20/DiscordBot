import { Base, BaseCommandInteraction, Client, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from 'discord.js';
import { Command } from "../types/command";
import dba from '../misc/databaseAdapter';
import { IBracket, IZitatWahl } from '../misc/databaseAdapter';





export const lastBracketCreated = [0,0];

export const NextBracket: Command = {
    name: "nextbracket",
    description: "Startet das nächste Auswahlverfahren für das beste Zitat",
    type: "CHAT_INPUT",
    options: [
        {
            name: "semester",
            description: "Das Semester für das das nächste Auswahlverfahren gestartet werden soll",
            type: "INTEGER",
            required: true
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({ephemeral: true});
        if (interaction.user.id != '902550033084346378'){
            await interaction.followUp({content: `Ich will nicht den Autokraten spielen, aber ein wenig die Wahl moderieren. Deshalb darfst du den Command nicht ausführen :(.`, ephemeral: true});
            return;
        }
        const semester = (interaction.options.get("semester")?.value) as number;
        const channel = interaction.channel;
        try{
            let bracket = await dba.getInstance().getNextSemesterBracket(semester);
            if(bracket == null){
                await interaction.followUp({content: `Es gibt kein nächstes Bracket für das Semester ${semester}, oder es ist ein Fehler aufgetreten`, ephemeral: true});
                return;
            }
            lastBracketCreated[0] = bracket.order_id;
            lastBracketCreated[1] = bracket.id;
            await interaction.followUp({content: `Das nächste Bracket für das Semester ${semester} wurde gestartet!`, ephemeral: true});

            let embed = generateVotingEmbed(bracket);
            let select = generateSelect(bracket);
            let buttonRow = generateButtonRow(bracket);

            if(buttonRow.components.length == 0){
            if(select.options.length == 0){
                await channel?.send({embeds: [embed]});
            }else{
                await channel?.send({embeds: [embed], components: [{type: "ACTION_ROW", components: [select]}]});
            }
        }else{
            if(select.options.length == 0){
                await channel?.send({embeds: [embed], components: [{type: "ACTION_ROW", components: buttonRow.components}]});
            }else{
                await channel?.send({embeds: [embed], components: [{type: "ACTION_ROW", components: [select]}, {type: "ACTION_ROW", components: buttonRow.components}]});
            }
        }

            

            // channel?.send({content: `Das nächste Bracket für das Semester ${semester} wurde gestartet!`});
        }catch (e:any){
            console.error(e);
            await interaction.followUp({content: `Es ist ein Fehler aufgetreten! ${e.message || ''}`, ephemeral: true});
        }
        
        
    }
};

function generateSelect(bracket: IBracket){
    let select = new MessageSelectMenu();
    select.customId = `zitatWahl-${bracket.order_id}-${bracket.id}`;
    select.placeholder = "Wähle dein Lieblingszitat aus!";
    select.options = bracket.zitate.map((zitat, index) => {
        return {
            label: limit(`${index + 1}. ${zitat.zitat.author}`, 100),
            description: limit(sanitizeMentions(zitat.zitat.zitat), 100),
            value: `${zitat.id}`,
            emoji: null,
            default: false,
        }
    });
    return select;

}

function generateButtonRow(bracket: IBracket){

    let buttons = bracket.zitate.map((zitat, index) => {
        if (zitat.zitat.image == null) return null;
        return new MessageButton(
            {
                customId: `zitatWahl-${bracket.order_id}-${bracket.id}-${zitat.id}`,
                label: limit(`${index + 1}. ${zitat.zitat.author}`, 80),
                style: "PRIMARY",
            }
        )
    });
    let filteredButtons = buttons.filter((button) => button != null) as MessageButton[];
    var buttonRow = new MessageActionRow();
    buttonRow.addComponents(filteredButtons);
    return buttonRow;

}

function generateVotingEmbed(bracket: IBracket){
    let embed = new MessageEmbed();
    if(bracket.zitate.length == 0){
        embed.setTitle("Keine Zitate für diese Woche!");
        embed.setDescription("Es sind keine Zitate mehr übrig! Das Bracket ist beendet!");
        return embed;
    }
    embed.setTitle(`${bracket.name} (${bracket.order_id};${bracket.id})`)
    embed.setDescription(`<@&1101120187291410483> Wähle dein Lieblingszitat aus! (Eine Stimme pro Person, Anonym, **Stimme kann geändert werden bis zum Schließen des Brackets**)`);
    embed.fields = bracket.zitate.map((zitat, index) => {
        const name = limit(`${index + 1}. ${zitat.zitat.author}`, 256);
        let prefix = "";
        if(zitat.zitat.image != null){
            prefix = "🖼️ "
        }
        let contextLink = zitat.zitat.contextLink;
        const linkText = contextLink == null ? " [Kein Kontext vorhanden]" : ` [Kontext](${contextLink})`;
        const value = limit(prefix + sanitizeMentions(zitat.zitat.zitat), 1024-linkText.length) + linkText;
        return {
            name: name,
            value: value,
            inline: false,
        }
    });
    embed.color = 0xff1133;
    return embed;
}

function limit(input: string, length: number){
    if(input.length <= length){
        return input;
    }
    return input.substring(0, length-3) + "...";
}

export const EndBracket: Command = {
    name: "endbracket",
    description: "Startet das nächste Auswahlverfahren für das beste Zitat",
    type: "CHAT_INPUT",
    options: [
        {
            name: "order_id",
            description: "order_id des brackets",
            type: "INTEGER",
            required: false,
        },
        {
            name: "id",
            description: "id des brackets",
            type: "INTEGER",
            required: false,
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply({ ephemeral: false });
        if (interaction.user.id != '902550033084346378') {
            await interaction.followUp({ content: `Ich will nicht den Autokraten spielen, aber ein wenig die Wahl moderieren. Deshalb darfst du den Command nicht ausführen :(.`, ephemeral: true });
            return;
        }
        const order_id = (interaction.options.get("order_id")?.value || lastBracketCreated[0]) as number;
        const id = (interaction.options.get("id")?.value || lastBracketCreated[1]) as number;
        try {
        
            const bracket = await dba.getInstance().finishBracket(id, order_id);
            await sendResults(bracket, interaction);

        } catch (e: any) {
            console.error(e);
            if (!interaction.replied) {

                await interaction.followUp({ content: `Es ist ein Fehler aufgetreten! ${e.message || ''}`, ephemeral: true });
            }
        }


    }
};

function sanitizeMentions(text: string){
    // remove all @-chars
    return text.replace(/@/g, "");
}

async function sendResults(bracket: IBracket, interaction: BaseCommandInteraction){

    let embed = new MessageEmbed();
    embed.setTitle(`Bracket ${bracket.name} wurde beendet`)
    embed.setDescription(`Das Bracket ist beendet! Das sind die Ergebnisse:`);
    let barDiagram = generateBarDiagram(bracket.zitate);
    console.log("🚀 ~ file: BestOfZitate.ts:192 ~ sendResults ~ barDiagram:", barDiagram)
    embed.fields = bracket.zitate.map((zitat, index) => {
        
        console.log("🚀 ~ file: BestOfZitate.ts:192 ~ sendResults ~ zitat:", zitat);
        const name = limit(`${index + 1}. ${zitat.zitat.author}`, 256);
        const bar = barDiagram[index];
        const barLine = `\n(${zitat.votes}) ${bar}`
        let prefix = "";
        if(zitat.zitat.image != null){
            prefix = "🖼️ "
        }
        const value = limit(prefix + sanitizeMentions(zitat.zitat.zitat), 1024-barLine.length)+barLine;
        return {
            name: name,
            value: value,
            inline: false
        }
    });
    embed.color = 0xff1133;
    const buttons = generateButtonRow(bracket);
    if(bracket.zitate[0].zitat?.image != null){
        embed.setImage(bracket.zitate[0].zitat?.image);
    }
    if(buttons.components.length > 0){
        await interaction.followUp({embeds: [embed], components: [buttons], ephemeral: false});
    }else{
        await interaction.followUp({embeds: [embed], ephemeral: false});
    }

}

function generateBarDiagram(zitate: IZitatWahl[]){

    let max = zitate[0].votes;
    let min = zitate[zitate.length-1].votes;
    let range = max-min;
    let barLength = 20;
    if(range == 0){
        if(max == 0){
            return zitate.map(() => "");
        }else{
            return zitate.map(() => `${"█".repeat(barLength)}`);
        }
    }
    let bar = [];
    for(let i = 0; i < zitate.length; i++){
        let zitat = zitate[i];
        let votes = zitat.votes;
        let percentage = (votes-min)/range;
        let ibarLength = Math.round(percentage*barLength);
        bar.push(`${"█".repeat(ibarLength)}`);
    }
    return bar;

}