import { Channel, EmbedFieldData, Message, MessageEmbed, SystemChannelFlags, TextBasedChannel } from "discord.js";
import fetch from "node-fetch";
import { wmData, wmGoal } from "types/misc";
import { config } from './../Bot';
import util from 'util';
import { wmTeamData } from './../types/misc';
import { send } from "process";
interface liveTickerHandler {

}

class LiveTickerHandler implements liveTickerHandler {


    interval: NodeJS.Timeout | undefined = undefined;
    lastUpdate: string = "";
    channel: TextBasedChannel;
    lastMessage: Message | undefined = undefined;
    lastGoals: wmGoal[] = [];
    api: string = 'WM2022';
    currentMatchId: number = 0;

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
        this.sendGoalsIfChanged(data);
        this.sendFinish(data);
        // check if data is new
    }

    async sendFinish(data: wmData[]) {
        if (this.currentGameFinished(data)) {
            const currentMatch = this.getCurrentMatch(data);
            if (currentMatch) {
                const winner = currentMatch.matchResults[0].pointsTeam1 > currentMatch.matchResults[0].pointsTeam2 ? currentMatch.team1 : currentMatch.team2;
                const embed = new MessageEmbed()
                    .setTitle(`Spiel beendet`)
                    .setDescription(`**${currentMatch.matchResults[0].pointsTeam1} : ${currentMatch.matchResults[0].pointsTeam2}** ${winner.teamName} gewinnt!`)
                    .addFields(this.getGoalFields(currentMatch.goals))
                    .setThumbnail(winner.teamIconUrl)
                await this.channel.send({ embeds: [embed] });
                this.sendInitialEmbed();
            }
        }
    }

    currentGameFinished(data: wmData[]) {
        const currentMatch = this.getCurrentMatch(data);
        if (currentMatch) {
            return currentMatch.matchIsFinished;
        }
        return false;
    }

    getGoalGetterTeam(goals: wmGoal[], team1: wmTeamData, team2: wmTeamData) {
        
        const lastStandings: wmGoal = goals[goals.length - 2] || {
            scoreTeam1: 0,
            scoreTeam2: 0
        } as wmGoal;
        
        if(lastStandings.scoreTeam1 < goals[goals.length - 1].scoreTeam1){
            return team1;
        }else{
            return team2;
        }

    }

    async sendGoalsIfChanged(data: wmData[]) {

        let currentMatch = this.getCurrentMatch(data);
        if (currentMatch) {
            if (currentMatch.goals.length > this.lastGoals.length) {
                this.lastGoals = currentMatch.goals;
                const scoreTeam = this.getGoalGetterTeam(currentMatch.goals, currentMatch.team1, currentMatch.team2);
                const fields = this.getGoalFields(currentMatch.goals.slice(currentMatch.goals.length - 1));
                const embed = new MessageEmbed()
                    .setTitle(`Tor für ${scoreTeam.teamName}`)
                    .setDescription(`**${currentMatch.matchResults[0].pointsTeam1} : ${currentMatch.matchResults[0].pointsTeam2}**`)
                    .addFields(fields)
                    .setThumbnail(scoreTeam.teamIconUrl)
                
                this.lastMessage?.deletable && await this.lastMessage?.delete();
                this.lastMessage = await this.channel.send({ embeds: [embed] });
            }
        }
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

    getCurrentMatch(data: wmData[]) {
            return data.find((match) => {
                return match.matchID == this.currentMatchId ;
            });
    }

    async sendInitialEmbed() {

        let upcomingOrCurrentMatch = await this.getUpcomingOrCurrentMatch();
        this.currentMatchId = upcomingOrCurrentMatch.matchID;
        this.lastGoals = upcomingOrCurrentMatch.goals;
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