import { config, zitateMap } from '../Bot';
import {
    BaseCommandInteraction,
    Client,
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
let chatHistory: {[key:string]: ChatCompletionRequestMessage[]} = {};



const openWeather = new OpenWeatherMap({
    apiKey: '524b326b5cc41b08d0f9a58877e75e05',
    language: 'de',
    units: 'metric'
});

openWeather.setGeoCoordinates(48.44, 8.68);


function getNextWheaters(forecast: ThreeHourResponse): ThreeHourResponse['list']{
    let now = new Date();
    let nextWheaters = forecast.list.filter((item) => {
        let itemDate = new Date(item.dt * 1000);
        return itemDate.getHours() > now.getHours();
    });
    return nextWheaters;
}

export const Wetter: Command = {
    name: "wetter",
    type: "CHAT_INPUT",
    description: "Zeigt das Wetter für Horb an",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        await interaction.deferReply();
        try{
            let wheater = await openWeather.getCurrentWeatherByGeoCoordinates()
            let forecast = await openWeather.getThreeHourForecastByGeoCoordinates()
            let embed = generateWheaterResponse(forecast, wheater);
            await interaction.followUp({embeds: [embed]});
            
        }catch(err){
            console.log(err);
            await interaction.followUp({content: "Fehler beim Abrufen des Wetters"});
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


function generateWheaterResponse(forecast: ThreeHourResponse, wheater: CurrentResponse){

    // Generate embed
    let itsDayTime:boolean = false;
    if(wheater.weather[0].icon.endsWith("d")){
        itsDayTime = true;
    }
    let embed = new MessageEmbed()
        .setTitle("Wetter in Horb")
        .setDescription(`Heute: ${wheaterIdToEmoji(wheater.weather[0].id, itsDayTime)} (${wheater.main.temp_max.toFixed(1)}°C / ${wheater.main.temp_min.toFixed(1) }°C)`)
        .setThumbnail(`http://openweathermap.org/img/wn/${wheater.weather[0].icon}.png`)
        .addFields(generateEmbedFields(forecast, wheater))
        .setColor("#ffa400")
        .setTimestamp()

    return embed;
}

function generateEmbedFields(forecast: ThreeHourResponse, wheater: CurrentResponse): EmbedFieldData[]{

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
    for(let i = 0; i < 3; i++){
        let item = nextWheaters[i];
        let itemDate = new Date(item.dt * 1000);
        fields.push({
            name: `${itemDate.getHours()}:00`,
            value: `${wheaterIdToEmoji(item.weather[0].id, item.sys.pod == 'd')} (${item.main.temp.toFixed(1)}°C  ${item.weather[0].description})`,
            inline: true
        });
    }

    return fields;

}