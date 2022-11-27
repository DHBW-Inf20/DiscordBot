import { Channel, EmbedFieldData, Message, MessageEmbed, SystemChannelFlags, TextBasedChannel } from "discord.js";
import fetch from "node-fetch";
import { wmData, wmGoal } from "types/misc";
import { config } from './../Bot';
import util from 'util';
interface liveTickerHandler {

}

class LiveTickerHandler implements liveTickerHandler {


    interval: NodeJS.Timeout | undefined = undefined;
    lastUpdate: string = "";
    channel: TextBasedChannel;
    lastMessage: Message | undefined = undefined;
    lastGoals: wmGoal[] = [];
    api: string = 'WM2022';

    constructor(channel: TextBasedChannel) {
        this.channel = channel;
    }

    async getData(): Promise<wmData[]> {
        let response = await fetch(`https://api.openligadb.de/getmatchdata/${this.api}/`)
        return response.json();
    }

    async processData() {

        // get data
        let data = await this.getData();
        // check if data is new
    }

    async getUpcomingOrCurrentMatch(wmData?: wmData[]) {
        if (!wmData) {
            wmData = await this.getData();
        }
        let unfinishedMatches = wmData.filter((match) => {
            return match.matchIsFinished == false;
        });

        unfinishedMatches.sort((a, b) => {
            const aDate = new Date(a.matchDateTimeUTC);
            const bDate = new Date(b.matchDateTimeUTC);
            return aDate.getTime() - bDate.getTime();
        });

        unfinishedMatches.forEach((match) => {
            console.log(match.matchDateTime, match.matchIsFinished, match.team1.teamName, match.team2.teamName);
        });

        return unfinishedMatches[0];

    }

    hasStarted(wmData: wmData) {
        return wmData.matchResults.length > 0;
    }

    async sendInitialEmbed() {

        let upcomingOrCurrentMatch = await this.getUpcomingOrCurrentMatch();
        let embed = new MessageEmbed();
        if (this.hasStarted(upcomingOrCurrentMatch)) {
            // Send embed with current match details (Standings etc)
            const fields = this.getGoalFields(upcomingOrCurrentMatch.goals);
            embed
                .setTitle(`${upcomingOrCurrentMatch.team1.teamName} vs. ${upcomingOrCurrentMatch.team2.teamName}`)
                .setDescription(`**${upcomingOrCurrentMatch.matchResults[0].pointsTeam1} : ${upcomingOrCurrentMatch.matchResults[0].pointsTeam2}**`)
                .setThumbnail(upcomingOrCurrentMatch.team2.teamIconUrl)
                .setAuthor({ name: "OpenLigaDB", iconURL: upcomingOrCurrentMatch.team1.teamIconUrl })
                .addFields(fields)
        } else {
            // Send embed with upcoming match details
            const d = new Date(upcomingOrCurrentMatch.matchDateTime);
            embed
                .setTitle(`Upcoming Match`)
                .setDescription(`Als nächstes Spielen: ${upcomingOrCurrentMatch.team1.teamName} vs. ${upcomingOrCurrentMatch.team2.teamName}`)
                .addFields([{ name: `Start`, value: d.toLocaleString("de-DE"), inline: true }])
                .setThumbnail(upcomingOrCurrentMatch.team2.teamIconUrl)
                .setAuthor({ name: "OpenLigaDB", iconURL: upcomingOrCurrentMatch.team1.teamIconUrl })
        }

        this.lastMessage = await this.channel.send({ embeds: [embed] });

    }

    getGoalFields(goals: wmGoal[]): EmbedFieldData[] {
        let fields: EmbedFieldData[] = [];
        // TODO: add which team scored
        goals.forEach((goal) => {
            fields.push({
                name: `${goal.goalGetterName}`,
                value: `${goal.matchMinute}' ${goal.isOvertime ? '(OT)' : ''}${goal.isPenalty ? '(Penalty)' : ''}${goal.isOwnGoal ? '(Eigentor)' : ''}`,
                inline: true
            })
        });
        return fields;
    }


    start() {

        this.sendInitialEmbed();
        const minutes = 1;
        this.interval = setInterval(async () => {
            if (this.isInTime()) {
                this.processData();
            }
        }, 1000 * 60 * minutes);


    }

    isInTime() {
        let date = new Date()
        const hour = date.getUTCHours();
        const UTC_STARTHOUR = 9;
        const UTC_ENDHOUR = 22;
        if (UTC_STARTHOUR <= hour || hour <= UTC_ENDHOUR) {
            return true;
        }

        return false;
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }


}

export const liveTickerHandlerMap = new Map<string, LiveTickerHandler>();

export { LiveTickerHandler }