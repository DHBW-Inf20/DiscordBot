import { Channel, EmbedFieldData, Message, MessageEmbed, SystemChannelFlags, TextBasedChannel } from "discord.js";
import fetch from "node-fetch";
import { wmData, wmGoal } from "types/misc";
import { config } from './../Bot';

interface liveTickerHandler {

}

class LiveTickerHandler implements liveTickerHandler {


    interval: NodeJS.Timeout | undefined = undefined;
    lastUpdate: string = "";
    channel: TextBasedChannel;
    lastMessage: Message | undefined = undefined;
    lastGoals: wmGoal[] = [];

    constructor(channel: TextBasedChannel){
        this.channel = channel;
    }

    async getData() : Promise<wmData[]>{
        let response = await fetch("https://api.openligadb.de/getmatchdata/WM2022")
        return response.json();
    }

    async processData(){

        // get data
        let data = await this.getData();

        // check if data is new
        let germanMatches = this.getAllGermanMatches(data);
        if(config?.debug){
            console.log(`Live-Ticker: Matches Found ${germanMatches.map(match=>{
                return `${match.team1} vs. ${match.team2}`
            })}`);
        }
        if(germanMatches.length > 0){
            let newUpdate = germanMatches[0].matchDateTimeUTC;
            config?.debug && console.log(`Live-Ticker: NewDate: ${newUpdate}, oldDate: ${this.lastUpdate}`)
            if(newUpdate != this.lastUpdate){
                this.lastUpdate = newUpdate;
                this.processMessage(germanMatches[0]);
            }
        }
    }

    async sendInitialEmbed(match: wmData){
        if(match.matchResults){
            // Game already started
            let embed = new MessageEmbed().
            setTitle(`Aktuelles Spiel`).
            setDescription(`${match.team1.teamName} vs. ${match.team2.teamName}`).
            addFields(this.getGoalFields(match.goals, match.team1.shortName, match.team2.shortName));

        }
    }

    async processMessage(match: wmData){
        
        // Check if game is finished
        if(match.matchIsFinished){
            this.stop();
            await this.sendFinishedMessage(match);
            return;
        }

        if(!this.lastMessage){
            await this.sendInitialEmbed(match);
        }

        // Check the goals
        if(match.goals.length > this.lastGoals.length){
            this.lastGoals = match.goals;
            await this.sendNewGoal(match);
        }


    }

    async sendNewGoal(match: wmData){

        let goal = match.goals[match.goals.length - 1];
        let oldGoal: wmGoal | undefined = undefined;
        if(match.goals.length > 2){
            oldGoal = match.goals[match.goals.length - 2];
        }else {
            oldGoal = match.goals[0];
            oldGoal.scoreTeam1 = 0;
            oldGoal.scoreTeam2 = 0;
        }

        // Check which team scored
        const team1Scored = goal.scoreTeam1 > oldGoal.scoreTeam1;

        let teamName = team1Scored ? match.team1.teamName : match.team2.teamName;

        let teamIcon = team1Scored ? match.team1.teamIconUrl : match.team2.teamIconUrl;


        let embed = new MessageEmbed().
            setTitle(`Tor: ${match.team1.teamName} vs. ${match.team2.teamName}`).
            setDescription(`${teamName}: ${goal.goalGetterName} ${goal.matchMinute} ${goal.isOwnGoal ? "(Eigentor)" : ""}${goal.isOvertime ? "(OT)" : ""}'`).
            setThumbnail(teamIcon)

        if(this.lastMessage){
            this.lastMessage.deletable && this.lastMessage.delete();
        }


        this.lastMessage = await this.channel.send({embeds: [embed]});
    }

    async sendFinishedMessage(match: wmData){

        let endErgebnis = [match.matchResults[0].pointsTeam1, match.matchResults[0].pointsTeam2];

        let winner = endErgebnis[0] > endErgebnis[1] ? match.team1 : match.team2;

        let fields: EmbedFieldData[] = this.getGoalFields(match.goals, match.team1.teamName, match.team2.teamName);

        fields.unshift({
            name: "Endergebnis",
            value: `${endErgebnis[0]} : ${endErgebnis[1]}`,
        })

        let embed = new MessageEmbed().
            setTitle(`Endergebnis: ${match.team1.teamName} vs. ${match.team2.teamName}`).
            setDescription(`Gewonnen hat ${winner}`).
            addFields(fields)

        this.channel.send({embeds: [embed]});
    }



    getGoalFields(goals: wmGoal[], team1: string, team2: string){
        return goals.map(goal => {
            return {
                name: `${goal.matchMinute}' ${goal.goalGetterName} ${goal.isPenalty ? "(Penalty)" : ""}${goal.isOwnGoal ? "(Eigentor)" : ""}${goal.isOvertime ? "(OT)" : ""}`,
                value: `${goal.scoreTeam1} : ${goal.scoreTeam2}`
            }
        })
    }

    getAllGermanMatches(data: wmData[]){
        return data.filter(match =>{
            return match.team1.teamGroupName == "Deutschland" || match.team2.teamGroupName == "Deutschland";
        })
    }

    start(){

        const minutes = 1;
        this.interval = setInterval(async () => {
            this.processData();
        }, 1000 * 60 * minutes);


    }

    stop(){
        if(this.interval){
            clearInterval(this.interval);
        }
    }


}

export const liveTickerHandlerMap = new Map<string, LiveTickerHandler>();

export { LiveTickerHandler }