import { ButtonInteraction, Interaction, Message, SelectMenuInteraction, User } from 'discord.js';
import dba from "./databaseAdapter";

export default class ZitatWahl{
    
    user: User;
    constructor(private interaction: SelectMenuInteraction | ButtonInteraction, private order_id: number, private bracket_id: number, private zitat_ids: number[]){
        
        this.user =  interaction.user;
        
    }
    
    async handleSelect() {
        try{
            if(this.zitat_ids.length !== 1){
                // Other
                await dba.getInstance().voteFinalZitatFromBracket(this.bracket_id, this.order_id, this.user.id, this.zitat_ids);
            }else{
                await dba.getInstance().voteZitatFromBracket(this.bracket_id, this.order_id, this.user.id, this.zitat_ids[0]); 
            }
            this.interaction.reply({content: `Du hast für erfolgreich abgestimmt! Vielen Dank (Ergebnisse gibt es erst nach dem Abschluss jedes Brackets)`, ephemeral: true});
            let embed = this.interaction.message.embeds[0];
            let bracket = await dba.getInstance().getBracket(this.bracket_id, this.order_id);
            if(bracket == null){
                return
            }
            let nVoters = bracket.voters.length;
            let titleSplit = embed.title!.split('|');
            let oldTitle = titleSplit.length !== 1 ? titleSplit.slice(1).join("").trim() : embed.title;
            embed.title = `(${nVoters}) | ${oldTitle}`;
            await (this.interaction.message as Message).edit({embeds: [embed]});
        }catch(e:any){
                this.interaction.reply({content: `Es ist ein Fehler aufgetreten! ${e.message || ''}`, ephemeral: true});
        }
    }

    async handleImageButton() {
         // Get image from the zitat
         const bracket = await dba.getInstance().getBracket(this.bracket_id, this.order_id);
         if (bracket == null) {
                await this.interaction.reply({content: `Es gibt kein Bracket mit der ID ${this.bracket_id} und der Order ID ${this.order_id}, oder es ist ein Fehler aufgetreten`, ephemeral: true});
            return;
         }
        const zitat = bracket.zitate.find(z => z.id == this.zitat_ids[0]);
    
        if(zitat == null){
            await this.interaction.reply({content: `Es gibt kein Zitat mit der ID ${this.zitat_ids[0]} im Bracket mit der ID ${this.bracket_id} und der Order ID ${this.order_id}, oder es ist ein Fehler aufgetreten`, ephemeral: true});
            return;
        }
        const image = zitat.zitat.image;
        if(image == null){
            await this.interaction.reply({content: `Das Zitat mit der ID ${this.zitat_ids[0]} im Bracket mit der ID ${this.bracket_id} und der Order ID ${this.order_id} hat kein Bild`, ephemeral: true});
            return;
        }
        await this.interaction.reply({content: `${zitat.zitat.zitat} - ${zitat.zitat.author} \n ${image}`, ephemeral: true});

    }
}   