import { ApplicationCommandOptionData, BaseCommandInteraction, Client, MessageActionRow, MessageButton, MessageEmbed, ButtonInteraction, User } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { client, kantinenInterface } from "../Bot";
import { kantine } from "interfaces/kantine";
import { Menu } from "types/dualis";

const constantButtonRow = new MessageActionRow().addComponents([
    new MessageButton().setCustomId('previousDay').setEmoji("⏮️").setStyle('SECONDARY'),
    new MessageButton().setCustomId('today').setEmoji("📆").setStyle('SECONDARY'),
    new MessageButton().setCustomId('nextDay').setEmoji("⏭️").setStyle('SECONDARY')
])

// For some reason without the builder it has a problem creating choices...
let cmd = new SlashCommandBuilder().setName("kantine").setDescription("Zeigt den Kantineplan an").addIntegerOption(option => 
    option.setName("kantine")
    .setDescription("Welche Kantine soll angezeigt werden?")
    .setRequired(false)
    .addChoices(
        { value: 1, name: "Mensa Ludwigsburg" },
        { value: 6, name: "Mensa Flandernstrasse" },
        { value: 9, name: "Mensa Esslingen Stadtmitte" },
        { value: 12, name: "Mensa Am Campus Horb" },
        { value: 13, name: "Mensa Göppingen" },
        { value: 21, name: "Foodtruck" }
));


export const Kantine: Command = {
    name: "kantine",
    description: "Informiert dich über das momentane Angebot der Kantine.",
    type: "CHAT_INPUT",
    options:[
        {
            name: "tag",
            description: "Wie viele Tage in der Zukunft (0 = heute, 1 = morgen, usw...)",
            type: "INTEGER",
            required: false
        },
        (cmd.options[0] as unknown as ApplicationCommandOptionData)
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        let dayParameter:number|undefined = (interaction.options.get("tag"))?.value as number | undefined;

        let locIdParameter: kantine["locId"] |undefined = (interaction.options.get("kantine"))?.value as kantine["locId"] | undefined;

        let mealData = await kantinenInterface.getMenu(dayParameter,locIdParameter);

        let components = [constantButtonRow];
        if(Object.keys(mealData.meals).length > 0) {
            components.push(createPreviewButtonRow(mealData.previews));
        }
        await interaction.deferReply();
        await interaction.followUp({
            embeds: [createEmbed(mealData.meals, mealData.date, interaction.user)],
            components
        });
    }
};


function createEmbed(mealData: Menu["meals"], date: Date, user: User) : MessageEmbed {

    const dateString = `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;

    let sentence1: string = "";
    let sentence2: string = "";
    let verb = "gibt";
    if(isDateInPast(date)) {
        sentence1 = `Das gab es am ${dateString}`;
        sentence2 = `Am ${dateString} gab es`;
        verb = "gab";
    }else{
        if(isToday(date)) {
            sentence1 = `Das gibt es heute (${dateString})`;
            sentence2 = `Heute (${dateString}) gibt es`;
        }else if (isNDaysInFuture(date, 1)) {
            sentence1 = `Das gibt es morgen (${dateString})`;
            sentence2 = `Morgen (${dateString}) gibt es`;
        }else if (isNDaysInFuture(date, 2)) {
            sentence1 = `Das gibt es übermorgen (${dateString})`;
            sentence2 = `Übermorgen (${dateString}) gibt es`;
        }else{
            sentence1 = `Das gibt es am ${dateString}`;
            sentence2 = `Am ${dateString} gibt es`;
        }
    }



    const description = Object.keys(mealData).length > 0 ? `${sentence1} in der Kantine zum essen!` : `${sentence2} kein Essen in der Kantine!`

    let embed:MessageEmbed = {
        color: 0x0093dd,
        title: 'Kantine',
        url: 'https://sws2.maxmanager.xyz/',
        author: {
            name: 'Studierendenwerk Stuttgart',
            iconURL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlSjF-ZpxwOYgzUxrCvqZlWV15j2PsG8xpAjwzOYLnUExyS4JfmQ9tbFoFGwUWryVsZrM&usqp=CAU',
            url: 'https://www.studierendenwerk-stuttgart.de/essen/speiseplan',
        },
        description,
        timestamp: new Date().getTime(),
        footer: {
            text: `Angefragt von ${user.username}`,
            iconURL: user?.displayAvatarURL(),
        },
    } as MessageEmbed;

    embed.fields = [];
    Object.keys(mealData).forEach(meal => {
        embed.fields.push({
            name: meal,
            value: mealData[meal],
            inline:true
        })
    });

    return embed;
}

function createPreviewButtonRow(previews: Menu["previews"]) : MessageActionRow {
    let row = new MessageActionRow();
    Object.keys(previews).forEach(preview => {
        row.addComponents([
            new MessageButton().setCustomId("kantinePreview_"+preview).setLabel(preview).setStyle('PRIMARY'),
        ]);
    });
    return row;
}

export function sendPreview(key: string, interaction: ButtonInteraction) {
    interaction.reply({
        ephemeral: true,
        content: kantinenInterface.cachedPreviews ? kantinenInterface.cachedPreviews[key] || "https://www.nicomatic.com/themes/custom/jango_sub/img/no-image.png" : "https://www.nicomatic.com/themes/custom/jango_sub/img/no-image.png"
    })
}

export async function nextPrevKantine(day: number, interaction: ButtonInteraction) {
    console.log(kantinenInterface.lastDay, day);
    let mealData = await kantinenInterface.getMenu(day);
    console.log(kantinenInterface.lastDay, day);
    console.log("Through mealData", mealData)
    let components = [constantButtonRow];
    if (Object.keys(mealData.meals).length > 0) {
        components.push(createPreviewButtonRow(mealData.previews));
    }
    await interaction.deferUpdate();
    await interaction.editReply({
        embeds: [createEmbed(mealData.meals, mealData.date, interaction.user)],
        components
    });
}

// https://flaviocopes.com/how-to-determine-date-is-today-javascript/
const isToday = (someDate:Date) => {
    const today = new Date()
    return someDate.getDate() == today.getDate() &&
        someDate.getMonth() == today.getMonth() &&
        someDate.getFullYear() == today.getFullYear()
}

const isNDaysInFuture = (someDate: Date, n:number) => {
    const otherDate = new Date(someDate.getFullYear(), someDate.getMonth(), someDate.getDate() - n);
    return isToday(otherDate);
}

const isDateInPast = (someDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return someDate.getTime() < today.getTime();
}