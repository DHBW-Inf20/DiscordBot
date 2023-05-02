import { Base, BaseCommandInteraction, Client, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, MessageSelectOption, MessageSelectOptionData } from 'discord.js';
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

            let embeds = generateVotingEmbed(bracket);
            console.log(embeds.map(e => e.description))
            let select: MessageSelectMenu[] = generateSelects(bracket);
            let buttonRow = generateButtonRow(bracket);

        for(let i = 0; i < embeds.length; i++){
            embeds[i].setFooter({text:`Seite ${i+1}/${embeds.length}`});
        }

        for(let i = 0; i < select.length; i++){


        if(buttonRow.components.length == 0){
            if(select.length == 0){
                await channel?.send({embeds: [embeds[i]]});
            }else{
                await channel?.send({ embeds: [embeds[i]], components: [{type: "ACTION_ROW", components: [select[i]]}]});
            }
        }else{
            if(select.length == 0){
                await channel?.send({embeds: [embeds[i]], components: [{type: "ACTION_ROW", components: buttonRow.components}]});
            }else{
                await channel?.send({embeds: [embeds[i]], components: [{type: "ACTION_ROW", components: [select[i]]}, {type: "ACTION_ROW", components: buttonRow.components}]});
            }
        }
            }   


            

            // channel?.send({content: `Das nächste Bracket für das Semester ${semester} wurde gestartet!`});
        }catch (e:any){
            console.error(e);
            await interaction.followUp({content: `Es ist ein Fehler aufgetreten! ${e.message || ''}`, ephemeral: true});
        }
        
        
    }
};

function generateSelects(bracket: IBracket){
    let returns: MessageSelectMenu[] = [];
    let options: MessageSelectOptionData[] = bracket.zitate.map((zitat, index) => {
        return {
            label: limit(`${index + 1}. ${zitat.zitat.author}`, 100),
            description: limit(sanitizeMentions(zitat.zitat.zitat), 100),
            value: `${zitat.id}`,
            default: false,
        }
    });

    if(options.length > 25){
        let select = new MessageSelectMenu();
        select.customId = `zitatWahl-${bracket.order_id}-${bracket.id}-0`;
        select.placeholder = "Wähle dein Lieblingszitat aus!";
        let options1: MessageSelectOptionData[] = options.slice(0, 25);
        select.addOptions(options1);
        returns.push(select);
    }
    let select = new MessageSelectMenu();
    select.customId = `zitatWahl-${bracket.order_id}-${bracket.id}-1`;
    select.placeholder = "Wähle dein Lieblingszitat aus!";
    let options2: MessageSelectOptionData[] = options.slice(25, options.length);
    select.addOptions(options2);
    returns.push(select);
    
    return returns;
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
    let embeds: MessageEmbed[] = [];
    if(bracket.zitate.length == 0){
        let embed = new MessageEmbed();
        embed.setTitle("Keine Zitate für diese Woche!");
        embed.setDescription("Es sind keine Zitate mehr übrig! Das Bracket ist beendet!");
        return [embed];
    }
    let testEmbed = new MessageEmbed();
    testEmbed.setTitle(`${bracket.name} (${bracket.order_id};${bracket.id})`)
    testEmbed.setDescription(`<@&1101120187291410483> Wähle dein Lieblingszitat aus! (Eine Stimme pro Person, Anonym, **Stimme kann geändert werden bis zum Schließen des Brackets**)`);
    let ind = 0;
    let splitIndecies: number[] = [];
    let fields = bracket.zitate.map((zitat, index) => {
        const name = limit(`${index + 1}. ${zitat.zitat.author}`, 256);
        let prefix = "";
        if(zitat.zitat.image != null){
            prefix = "🖼️ "
        }
        let contextLink = zitat.zitat.contextLink;
        const linkText = contextLink == null ? " [Kein Kontext vorhanden]" : ` [Kontext](${contextLink})`;
        const value = limit(prefix + sanitizeMentions(zitat.zitat.zitat), 1024-linkText.length) + linkText;

        ind++;
        if(ind >= 25){
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
        embed.setTitle(`${bracket.name} (${bracket.order_id};${bracket.id})`)
        embed.setDescription(`<@&1101120187291410483> Wähle dein Lieblingszitat aus! (Eine Stimme pro Person, Anonym, **Stimme kann geändert werden bis zum Schließen des Brackets**)`);
        embed.color = 0xff1133;
        embed.addFields(fields.slice(lastIndex, index));
        lastIndex = index;
        embeds.push(embed);
    });
        let embed = new MessageEmbed();
        embed.setTitle(`${bracket.name} (${bracket.order_id};${bracket.id})`)
        embed.setDescription(`<@&1101120187291410483> Wähle dein Lieblingszitat aus! (Eine Stimme pro Person, Anonym, **Stimme kann geändert werden bis zum Schließen des Brackets**)`);
        embed.color = 0xff1133;
        embed.addFields(fields.slice(lastIndex, fields.length));
        embeds.push(embed);

    return embeds;
}

function limit(input: string, length: number){
    if(input.length <= length){
        return input;
    }
    return input.substring(0, length-3) + "...";
}

export const EndBracket: Command = {
    name: "endbracket",
    description: "Endet das Auswahlverfahren für ein Bracket.",
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
    bracket.zitate = bracket.zitate.slice(0, 10);
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