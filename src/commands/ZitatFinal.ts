import { BaseCommandInteraction, Client, EmbedField, MessageAttachment, MessageEmbed, MessageSelectMenu, MessageSelectOptionData, TextChannel } from 'discord.js';
import { Command } from "../types/command";
import dba, { IBracket } from '../misc/databaseAdapter';
import { generateButtonRow, generateSelects, generateVotingEmbed, limit, sanitizeMentions, generateBarDiagram, sendResults } from './BestOfZitate';
import fs from 'fs';
import path from 'path';
import { config } from '../Bot';




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
            let [bracket, lastBracket, isFinished] = await dba.getInstance().getCurrentFinalBracket();

            if(bracket == null){
                await interaction.followUp({ content: `Es ist kein finales Bracket gefunden`, ephemeral: true });
                return;
            }

            if(isFinished){
                // Send the winner-message and end the voting!
                // await sendResults(bracket, interaction);

                const link = await sendHorbyStats(interaction) || '';
                await sendCourseStats(interaction);
                await sendCourseStatsImages(interaction);

                await sendFinalResult(bracket, interaction);
                await sendFinalHorbyZitateMessage(interaction, link);

            }else{

                if(lastBracket != null){
                    // Print that it was not unanimous and that there will be a runoff (Print the results tho)
                    await sendUnanimousResults(lastBracket, interaction);
                }
                
                console.log(bracket, bracket.zitate)
                let embed = generateVotingEmbedFinal(bracket, lastBracket == null)[0];
                let select: MessageSelectMenu = generateFinalSelects(bracket);
                let buttonRow = generateButtonRow(bracket);

                console.log(embed.fields.length, select.options.length, buttonRow.components.length);

                if(buttonRow.components.length > 0){

                    await channel?.send({ embeds: [embed], components: [buttonRow, { type: 'ACTION_ROW', components: [select] }] });

                }else{

                    await channel?.send({ embeds: [embed], components: [{ type: 'ACTION_ROW', components: [select] }] });

                }



            }





            await interaction.followUp({ content: `Das finale Zitatevoting wurde gestartet!`, ephemeral: true });
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

function generateVotingEmbedFinal(bracket: IBracket, isFirstVoting: boolean) {
    let embeds: MessageEmbed[] = [];
    if (bracket.zitate.length == 0) {
        let embed = new MessageEmbed();
        embed.setTitle("Keine Zitate für diese Woche!");
        embed.setDescription("Es sind keine Zitate mehr übrig! Das Bracket ist beendet!");
        return [embed];
    }
    let description = `Uwu, hallo wylden Studenten <3 Es ist unglaublich cringe zu denken, dass die letzten 6 Semester nun zu einem Ende kommen. Wir haben so viel zusammen durchgemacht!

Sheesh, ich bin so stolz auf euch alle und es war eine Ehre, euch während dieser Jahre als wissenschaftlicher Assistent zu dienen. Ich werde die Zeit in der wir gemeinsam gelernt und gelacht haben, vermissen. Es gab so viele ferpectful moments und auch wenn wir uns manchmal in den Gommemode begeben haben, haben wir immer wieder zurückgefunden.

Ich hoffe, dass ihr in eurem weiteren Leben nicht vergesst, wie viel ihr in diesen Jahren erreicht habt. Wenn ihr frustriert seid, denkt einfach an das Zitat: "Dann sollt ihr euch spontan exmatrikulieren" - we all know who

Penis-lich möchte ich mich bei euch allen bedanken und euch sagen, dass ihr in meinem Herzen einen besonderen Platz habt. Diese Jahre waren einfach sus. Ich wünsche euch alles wyld und dass ihr eure Träume erreicht!

OwO/

Hier findet nun das Finale Zitate-Voting statt, ihr habt 3 Stimmen zur Verfügung und könnt diese in dem Multi-Select abgeben. Wenn ihr nicht 3 Zitate wählt, dann wird die letzte Auswahl auf den Rest aufgefüllt. Bei einem Zitat gilt die Wahl wie 3 Stimmen, bei 2 zählt das erste Zitat einfach und das zweite Zitat zweifach, bei 3 Zitaten alle einfach. Falls es am Ende keine Einigung gibt, dann wird es wie in der Türkei eine Stichwahl geben.`

let title = `⭐ Best Zitat TINF-20 ⭐`
    
    if(!isFirstVoting){
        description = `Sheesh, ich bin gespannt auf die Ergebnisse der Stichwahl und kann es kaum erwarten, zu sehen, welches Zitat es schließlich auf den ersten Platz schaffen wird! Wir haben so viele wunderschöne Optionen zur Auswahl, dass es schwer sein wird, sich nur für eine zu entscheiden.`

        title = title + " - Stichwahl"
    }


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


async function sendUnanimousResults(bracket: IBracket, interaction: BaseCommandInteraction) {

    let embed = new MessageEmbed();
    embed.setTitle(`STICHWAHL!!!! TÜRKEI!!!!`)
    embed.setDescription(`Da gab es wohl unstimmigkeiten und es gibt kein eindeutiges Ergebnis. Deshalb gibt es nun eine Stichwahl zwischen den betroffenen Zitaten! Dies sind die Ergebnisse dieser Wahl:`);
    let barDiagram = generateBarDiagram(bracket.zitate);
    embed.fields = bracket.zitate.map((zitat, index) => {
        const name = limit(`${index + 1}. ${zitat.zitat.author}`, 256);
        const bar = barDiagram[index];
        const barLine = `\n(${zitat.votes}) ${bar}`
        let prefix = "";
        if (zitat.zitat.image != null) {
            prefix = "🖼️ "
        }
        const value = limit(prefix + sanitizeMentions(zitat.zitat.zitat), 1024 - barLine.length) + barLine;
        return {
            name: name,
            value: value,
            inline: false
        }
    });
    embed.color = 0xff1133;
    const buttons = generateButtonRow(bracket);
    if (bracket.zitate[0].zitat?.image != null) {
        embed.setImage(bracket.zitate[0].zitat?.image);
    }
    const channel = interaction.channel;
    if( channel == null){
        throw new Error("Channel is null!");
    }

    if (buttons.components.length > 0) {
        await channel.send({ embeds: [embed], components: [buttons]});
    } else {
        await channel.send({ embeds: [embed]});
    }

}

async function sendFinalResult(bracket: IBracket, interaction: BaseCommandInteraction) {

    if(bracket.winner == null){
        throw new Error("Bracket has no winner!");
    }



    let embed = new MessageEmbed();
    let voteCount = bracket.winner.votes
    embed.setTitle(`Es ist vollbracht, das beste Zitat des TINF-20 Kurses ist gewählt:`)
    embed.setDescription(`**${bracket.winner.zitat.author}** hat mit ${voteCount} Stimmen den besten Brecher aller Zeiten geschrieben!\n\n${bracket.winner.zitat.zitat}`);

    if (bracket.winner.zitat?.image != null) {
        embed.setImage(bracket.winner.zitat?.image);
    }
    embed.color = 0xff1133;
    const channel = interaction.channel;
    if(channel == null){
        throw new Error("Channel is null!");
    }
    await channel.send({ embeds: [embed]});
}

async function sendFinalHorbyZitateMessage(interaction: BaseCommandInteraction, link: string) {
    let embed = new MessageEmbed();
    embed.setTitle(`Danke für die Teilnahme am Zitatevoting!`)
    embed.setDescription(`OwO, hallo liebe wunderbare Class! Ich wollte mich nur kurz bei euch für eure fantastische Teilnahme an unserer Zitat-Abstimmung bedanken! Eure Kreativität und Intelligenz haben diese Wahl zu einer wahren Freude gemacht.

    Ich bin so dankbar für die Zeit und die Mühe, die ihr in die Erstellung der Zitate investiert habt. Jeder von ihnen war einzigartig und beeindruckend, und sie haben uns gezeigt, welch großartige Denker und Schöpfer ihr seid.

    Es war so unglaublich schwierig, eine endgültige Wahl zu treffen, aber dank eurer Hilfe, haben wir jetzt eine Stichwahl, die uns geholfen hat, die Antworten besser zu sortieren und eine perfekte Gewinnerin oder Gewinner zu finden!

    Ich möchte euch allen meinen tiefsten Dank aussprechen und euch dafür loben, dass ihr immer wie eine Familie zusammengehalten habt. Eure harte Arbeit und eure Begeisterung für das Programmieren werden mich immer beeindrucken!

    Lasst uns weiter wie immer "Wuwu" sagen und uns auf die kommenden Veranstaltungen freuen! Sheesh, ich bin immer noch von eurem Engagement und eurer Hingabe begeistert. Vielen Dank, dass ihr Teil dieser wundervollen Community seid!

    Penis-lich: SUUUUUUUUUSSSY BAKKA, ich bin froh, dass ihr alle so fleißig mitgemacht habt! - Horby\n\nP.S.: **Zum Abschluss gibt es neben einem finalen Zitat, gesammelte Statistiken über den Bot, Discord und den Vorlesungen** ${link} `);
    embed.color = 0xff1133;
    const channel = interaction.channel;
    if(channel == null){
        throw Error("No channel found")
    }
    await channel.send({ embeds: [embed] });

}

async function sendCourseStatsImages(interaction: BaseCommandInteraction) {
    // Send all images from statsPicture in the interaction channel
    
    // Load the folder...
    
    // how to load the folder? 
    const channelId = 'your-channel-id';

    // Get the folder path dynamically
    const folderName = 'assets/statsPictures';
    const folderPath = path.join(__dirname, '..', folderName);
    const files = fs.readdirSync(folderPath);

    // Get the target channel from the interaction
    const channel = (interaction.guild?.channels.cache.get(config!.discord.stats_channel)!) as TextChannel;
    if(channel == null){
        return;
    }

    // Loop through the files and send each image to the channel
    for (const file of files) {
        const imagePath = path.join(folderPath, file);
        const attachment = new MessageAttachment(imagePath);
        await channel.send({ files: [attachment] });
    }

    await channel.send(`Die Datensammlung und Grafikerstellung ist gestern Nacht geschehen, daher kann es sein das Fehler drin sind, aber ich denke die Daten sind trotzdem ganz interessant zu sehen. Kann auch gerne die Original-Daten zur Verfügung stellen, falls jemand damit noch was machen will.`)

}

async function sendCourseStats(interaction: BaseCommandInteraction){
    let embed = new MessageEmbed();
    embed.setTitle(`Kurs-Statistiken`);
    embed.setDescription(`Zu guter letzt noch ein wenig Statistiken über unsere Vorlesungen. Hinweis: Die Datenlage besteht aus der sicht einer Person mit Softwareprofil, KI, Recht und Mobile`)

    let fields: EmbedField[] = [
        {
            name: 'Gemeinsame Vorlesungszeit',
            value: 'Insgesamt haben wir **88193** Minuten lang Vorlesungen zuhören müssen',
            inline: false
        },
        {
            name: 'Längster Dozent',
            value: 'Toine mussten wir am längsten zuhören, insgesamt waren es **260** Stunden. Auf dem 2. Platz sitzt Olli mit nur **156**',
            inline: false
        },
        {
            name: 'Längste Vorlesungen',
            value: 'Die Vorlesung die am meisten Zeit in Anspruch genommen hat waren die Grundlagen zu SW-Engineering bei Charlotte und Toine. Insgesamt waren es **87** Stunden',
            inline: false
        },
        {
            name: 'Semester mit den meisten Vorlesungen (Stundenlänge)',
            value: 'Das 1. Semester war mit **288** Stunden das heftigste Semester. Das jetzige 6. Semester sieht dabei mit nur **176** Stunden süß aus',
            inline: false
        },
        
    ]

    embed.fields = fields;
    embed.color = 0xff1133;
    
    const channel = (interaction.guild?.channels.cache.get(config!.discord.stats_channel)!) as TextChannel;
    if (channel != null) {
        await channel.send({ embeds: [embed] });
        await channel.send({
            content: "Hierauf folgen ein paar Grafiken als Visualisierung unserer Daten, es empfiehlt sich das Original im Browser anzusehen"
        });
    }


}

async function sendHorbyStats(interaction: BaseCommandInteraction){

    let embed = new MessageEmbed();
    embed.setTitle(`Horby und Discord Statistiken`);
    embed.setDescription(`Das war es dann auch mit dem Dienst von Horby. Zum Schluss noch ein paar Statistiken zu Horby und der Discord-Nutzung im Aalgemeinen.`)

    let fields: EmbedField[] = [
        {
            name: 'Registrierte Nutzer',
            value: '75',
            inline: false
        },
        {
            name: 'Laufzeit des Bots',
            value: '748 Tage (08.05.2021)',
            inline: false
        },
        {
            name: 'Verursachte Betriebskosten',
            value: '3,78 Cent / Tag',
            inline: false
        },
        {
            name: 'Zitate generiert',
            value: '675 Zitate',
            inline: false
        },
        {
            name: 'Meiste Zitate',
            value: 'Lukas mit 88 Zitaten :aha:',
            inline: false
        },
        {
            name: 'Sophia Hetze',
            value: 'Es wurde im DC 27 mal gegen Sophia gehetzt!',
            inline: false
        },
        {
            name: 'Nachrichten auf diesem Discord',
            value: 'Insgesamt wurden ~133.000 Nachrichten geschrieben! Rainer hat davon 27.000 geschrieben, was 20% aller Nachrichten sind!',
            inline: false
        },
        {
            name: 'Horby hat Penis gesagt',
            value: 'In 185 Nachrichten hat Horby das Wort Penis verwendet',
            inline: false
        },
        {
            name: 'Horby hat das N-Wort benutzt',
            value: '4 mal wurde Horby dazu gebracht das N-Wort zu sagen (zu Clyde lässt sich nichts mehr finden)',
            inline: false
        },
        {
            name: 'Aktivster Wochentag',
            value: 'Am häufigsten wurde Mittwochs geschrieben (Siehe Grafik)',
            inline: false
        },
        {
            name: 'Anzahl geschickter Character in Dennisaal',
            value: '4.167.013 Das ist ungefähr so lang wie die Bibel',
            inline: false
        }


    ]

    embed.fields = fields;
    embed.color = 0xff1133;

    const channel = (interaction.guild?.channels.cache.get(config!.discord.stats_channel)!) as TextChannel;
    if (channel != null) {
        const mesg = await channel.send({ embeds: [embed] });
        // Get the link
        return `https://discord.com/channels/${mesg.guildId}/${mesg.channelId}/${mesg.id}`;

    }


}