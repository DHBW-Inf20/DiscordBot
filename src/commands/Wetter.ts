import { config, openWeather, zitateMap } from '../Bot';
import {
    BaseCommandInteraction,
    Client,
    ColorResolvable,
    CommandInteraction,
    ContextMenuInteraction,
    EmbedFieldData,
} from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import { Command, ContextMenuCommand } from "../types/command";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import dba, { IDavinciData } from '../misc/databaseAdapter';


import OpenWeatherMap from 'openweathermap-ts';
import { CurrentResponse, ThreeHourResponse } from 'openweathermap-ts/dist/types';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
let chatHistory: { [key: string]: ChatCompletionRequestMessage[] } = {};


function getNextWheaters(forecast: ThreeHourResponse): ThreeHourResponse['list'] {
    let now = new Date();
    let nextWheaters = forecast.list.filter((item) => {
        return item.dt > (now.getTime() / 1000);
    });

    // Sort by time
    nextWheaters.sort((a, b) => {
        let aDate = new Date(a.dt * 1000);
        let bDate = new Date(b.dt * 1000);
        return aDate.getTime() - bDate.getTime();
    });
    return nextWheaters;
}

export const Wetter: Command = {
    name: "wetter",
    type: "CHAT_INPUT",
    options: [
        {
            name: "ort",
            description: "Ort für das Wetter (so genau wie möglich)",
            type: "STRING",
            required: false
        }
    ],
    description: "Zeigt das Wetter für Horb an",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        let ort = interaction.options.get("ort")?.value as string || "Horb am Neckar";
        await interaction.deferReply();
        try {
            let wheater = await openWeather.getCurrentWeatherByCityName({ cityName: ort });
            let forecast = await openWeather.getThreeHourForecastByCityName({ cityName: ort });
            let embed = generateWheaterResponse(forecast, wheater);
            await interaction.followUp({ embeds: [embed] });

        } catch (err) {
            await interaction.followUp({ content: "Fehler beim Abrufen des Wetters" });
        }

    }
};

function getWeathersForNextNEvenings(forecast: ThreeHourResponse, n: number = 3) {
    let nextWheaters = getNextWheaters(forecast);
    let now = new Date();
    let nextEvenings = nextWheaters.filter((item) => {
        let date = new Date(item.dt * 1000);
        // Check if its n times in the future
        if (date.getDate() > now.getDate() + n) {
            return false;
        }
        return !(date.getDate() > now.getDate() + n) && date.getHours() >= 13 && date.getHours() <= 22;
    });
    let results: ThreeHourResponse['list'][] = [];
    for (let i = 0; i <= n; i++) {
        results.push(nextEvenings.filter((item) => {
            let date = new Date(item.dt * 1000);
            return date.getDate() == now.getDate() + i;
        }));
    }
    return results;
}
const thresholds = {
    rain: 0.5,
    temp: 6
}
function calcGrillen(wheater: CurrentResponse, forecast: ThreeHourResponse, n: number = 3): [EmbedFieldData[], ColorResolvable] {
    // Calc if it is good to grill and when its the best time in the next 3 days
    let embedFields: EmbedFieldData[] = [];
    let color: ColorResolvable= "RED";
    let nextWheaters = getWeathersForNextNEvenings(forecast, n);
    if (!nextWheaters) {
        return [[], color];
    }
    let goodGrillDates = [];
    for (let i = 0; i < nextWheaters.length; i++) {
        let dayWheaters = nextWheaters[i];
        for (let j = 0; j < dayWheaters.length; j++) {
            let next3Hours = dayWheaters[j];
            let rainProbability = (next3Hours as any).pop;
            let temp = next3Hours.main.temp;
            const badGrillWeather = (rainProbability > thresholds.rain) || (temp < thresholds.temp);
            if (!badGrillWeather) {
                goodGrillDates.push(next3Hours);
            }
        }
        let todaySpan: ThreeHourResponse['list'] = [];
        let bufferTodySpan: ThreeHourResponse['list'] = [];
        for (let j = 0; j < goodGrillDates.length; j++) {
            let next3Hours = goodGrillDates[j];
            let hour = new Date(next3Hours.dt * 1000).getHours();

            if(todaySpan.length == 0) {
                todaySpan.push(next3Hours);
                continue;
            }
            let lastHour = new Date(todaySpan[todaySpan.length - 1].dt * 1000).getHours();
            if (hour - lastHour == 3) {
                todaySpan.push(next3Hours);
            } else {
                if (todaySpan.length > bufferTodySpan.length) {
                    bufferTodySpan = todaySpan;
                }
                todaySpan = [next3Hours];
            }
        }
        if (todaySpan.length > bufferTodySpan.length) {
            bufferTodySpan = todaySpan;
        }

        // Calc avg temp and prob
        let avgTemp = 0;
        let avgRainProb = 0;
        let maxTemp = 0;
        let maxRainProb = 0;
        for (let j = 0; j < bufferTodySpan.length; j++) {
            let next3Hours = bufferTodySpan[j];
            avgTemp += next3Hours.main.temp;
            avgRainProb += (next3Hours as any).pop;
            if (next3Hours.main.temp > maxTemp) {
                maxTemp = next3Hours.main.temp;
            }
            if ((next3Hours as any).pop > maxRainProb) {
                maxRainProb = (next3Hours as any).pop;
            }
        }
        avgTemp /= bufferTodySpan.length;
        avgRainProb /= bufferTodySpan.length;
        // Create a special case for today (index 0)
        if(bufferTodySpan.length == 0) {
            avgTemp = 0;
            avgRainProb = 0;
            maxTemp = 0;
            maxRainProb = 0;
            for (let j = 0; j < nextWheaters[i].length; j++) {
                let next3Hours = nextWheaters[i][j];
                avgTemp += next3Hours.main.temp;
                avgRainProb += (next3Hours as any).pop;
                if (next3Hours.main.temp > maxTemp) {
                    maxTemp = next3Hours.main.temp;
                }
                if ((next3Hours as any).pop > maxRainProb) {
                    maxRainProb = (next3Hours as any).pop;
                }
            }
            avgTemp /= nextWheaters[i].length;
            avgRainProb /= nextWheaters[i].length;
            
        }
        const forecastString = `\n:thermometer: ${avgTemp.toFixed(2)}°C (max. ${maxTemp.toFixed(2)}°C)\n :cloud_rain: ${avgRainProb.toFixed(2)}% (max. ${maxRainProb.toFixed(2)}%).`
        if(bufferTodySpan.length == 1) {
            let tempElement = JSON.parse(JSON.stringify(bufferTodySpan[0]));
            // Change the time to 3 hours +
            let date = new Date(tempElement.dt * 1000);
            date.setHours(date.getHours() + 3);
            tempElement.dt = date.getTime() / 1000;
            bufferTodySpan.push(tempElement);
        }   
        if (i == 0) {

            // See what is the longest span of good wheater
            if(bufferTodySpan.length == 0) {
                embedFields.push({
                    name: "😡 Heute",
                    value: ` Heute ist es leider nicht gut zum Grillen.${forecastString}`,
                    inline: false});
            }else{
                color = "GREEN";
                embedFields.push({
                    name: "💚 Heute",
                    value: `Heute ist es von ${new Date(bufferTodySpan[0].dt * 1000).getHours()}:00 bis ${new Date(bufferTodySpan[bufferTodySpan.length - 1].dt * 1000).getHours()}:00 Uhr gut zum Grillen.${forecastString}`,
                    inline: false
                });
            }
        } else {
            if (goodGrillDates.length > 0) {
                if(color != "GREEN") {
                    color = "YELLOW";
                }
                embedFields.push({
                    name: `💚 ${new Date(goodGrillDates[0].dt * 1000).getDate()}.${new Date(goodGrillDates[0].dt * 1000).getMonth() + 1} (${new Date(goodGrillDates[0].dt * 1000).getHours()}:00 bis ${new Date(goodGrillDates[goodGrillDates.length - 1].dt * 1000).getHours()}:00)`,
                    value: `Gutes Grillwetter!${forecastString}`,
                inline: true});
            }else {
                embedFields.push({
                    name: `😡 ${new Date(nextWheaters[i][0].dt * 1000).getDate()}.${new Date(nextWheaters[i][0].dt * 1000).getMonth() + 1}`,
                    value: `Kein Gutes Wetter :(.${forecastString}`,
                    inline: true
                });
            }
        }

        goodGrillDates = [];
    }
    return [embedFields, color];
}

export const GrillWetter: Command = {
    name: "grillen",
    type: "CHAT_INPUT",
    options: [
        {
            name: "tage",
            description: "Anzahl der Tage für die die Aussichten berechnet werden sollen",
            type: "INTEGER",
            required: false,
            max_value: 5,
            min_value: 1
        },
        {
            name: "ort",
            description: "Ort für das Wetter (so genau wie möglich)",
            type: "STRING",
            required: false
        }
    ],
    description: "Berechnet ob das Wetter in nächster Zeit gut zum abendlichen Grillen ist",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        let n = interaction.options.get("tage")?.value as number || 3;
        let ort = interaction.options.get("ort")?.value as string || "Horb am Neckar";
        await interaction.deferReply();
        try {
            let wheater = await openWeather.getCurrentWeatherByCityName({ cityName: ort });
            let forecast = await openWeather.getThreeHourForecastByCityName({ cityName: ort });
            const [eFields, col] = calcGrillen(wheater, forecast, n);
            let embed = new MessageEmbed()
                .setTitle("Grillwetter in "+ort)
                .addFields(eFields)
                .setColor(col)
            await interaction.followUp({ embeds: [embed] });

        } catch (err) {
            console.error(err);
            await interaction.followUp({ content: "Fehler beim Berchnen" });
        }

    }
};

function wheaterIdToEmoji(id: number, day: boolean): string {
    switch (id) {
        case 200:
        case 201:
        case 202:
        case 210:
        case 211:
        case 212:
        case 221:
        case 230:
        case 231:
        case 232:
            return ":thunder_cloud_rain:";
        case 300:
        case 301:
        case 302:
        case 310:
        case 311:
        case 312:
        case 313:
        case 314:
        case 321:
            return ":cloud_rain:";
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
        case 520:
        case 521:
        case 522:
        case 531:
            return ":cloud_rain:";
        case 511:
            return ":cloud_snow:";
        case 600:
        case 601:
        case 602:
        case 611:
        case 612:
        case 615:
        case 616:
        case 620:
        case 621:
        case 622:
            return ":cloud_snow:";
        case 701:
        case 711:
        case 721:
        case 731:
        case 741:
        case 751:
        case 761:
        case 762:
        case 771:
        case 781:
            return ":fog:";
        case 800:
            if (day) return ":sunny:";
            else return ":crescent_moon:";
        case 801:
            if (day) return ":white_sun_cloud:";
            else
                return ":cloud:";
        case 802:
        case 803:
        case 804:
            return ":cloud:";
        default:
            return ":question:";
    }
}


function generateWheaterResponse(forecast: ThreeHourResponse, wheater: CurrentResponse) {

    // Generate embed
    let itsDayTime: boolean = false;
    if (wheater.weather[0].icon.endsWith("d")) {
        itsDayTime = true;
    }
    let embed = new MessageEmbed()
        .setTitle(`Wetter in ${wheater.name} (${wheater.sys.country})`)
        .setDescription(`Heute: ${wheaterIdToEmoji(wheater.weather[0].id, itsDayTime)} (${wheater.main.temp_max.toFixed(1)}°C / ${wheater.main.temp_min.toFixed(1)}°C)`)
        .setThumbnail(`http://openweathermap.org/img/wn/${wheater.weather[0].icon}.png`)
        .addFields(generateEmbedFields(forecast, wheater))
        .setColor("#ffa400")
        .setTimestamp()

    return embed;
}

function generateEmbedFields(forecast: ThreeHourResponse, wheater: CurrentResponse): EmbedFieldData[] {

    let fields: EmbedFieldData[] = [];
    let nextWheaters = getNextWheaters(forecast);
    let now = new Date();

    // Add current wheater
    fields.push({
        name: `Jetzt (${now.getHours()}:00)`,
        value: `${wheaterIdToEmoji(wheater.weather[0].id, wheater.weather[0].icon.endsWith('d'))} (${wheater.main.temp.toFixed(1)}°C ${wheater.weather[0].description})`,
        inline: false
    });

    // Add next wheaters
    for (let i = 0; i < 6; i++) {
        let item = nextWheaters[i];
        let itemDate = new Date(item.dt * 1000);
        let pop = (item as unknown as any).pop * 100;
        fields.push({
            name: `${itemDate.getHours()}:00 (${dateDayToString(itemDate)})`,
            value: `${wheaterIdToEmoji(item.weather[0].id, item.sys.pod == 'd')} (${item.main.temp.toFixed(1)}°C  ${item.weather[0].description} [${pop.toFixed(2)}%])`,
            inline: true
        });
    }

    return fields;

}

function dateDayToString(date: Date): string {

    // if its today, return "Heute"
    let now = new Date();
    if (date.getDate() == now.getDate() && date.getMonth() == now.getMonth() && date.getFullYear() == now.getFullYear()) {
        return "Heute";
    }

    switch (date.getDay()) {
        case 0:
            return "Sonntag";
        case 1:
            return "Montag";
        case 2:
            return "Dienstag";
        case 3:
            return "Mittwoch";
        case 4:
            return "Donnerstag";
        case 5:
            return "Freitag";
        case 6:
            return "Samstag";
        default:
            return "Unbekannt";
    }
}

