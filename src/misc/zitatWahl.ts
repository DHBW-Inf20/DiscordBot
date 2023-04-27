import { ButtonInteraction, Interaction, SelectMenuInteraction, User } from 'discord.js';
import dba from "./databaseAdapter";

export default class ZitatWahl{
    
    user: User;
    constructor(private interaction: SelectMenuInteraction | ButtonInteraction, private order_id: number, private bracket_id: number, private zitat_id: number){
        
        this.user =  interaction.user;
        
    }
    
    async handleSelect() {
        try{
            await dba.getInstance().voteZitatFromBracket(this.bracket_id, this.order_id, this.user.id, this.zitat_id); 
            this.interaction.reply({content: `Du hast für erfolgreich abgestimmt! Vielen Dank (Ergebnisse gibt es erst nach dem Abschluss jedes Brackets)`, ephemeral: true});
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
        const zitat = bracket.zitate.find(z => z.id == this.zitat_id);
    
        if(zitat == null){
            await this.interaction.reply({content: `Es gibt kein Zitat mit der ID ${this.zitat_id} im Bracket mit der ID ${this.bracket_id} und der Order ID ${this.order_id}, oder es ist ein Fehler aufgetreten`, ephemeral: true});
            return;
        }
        const image = zitat.zitat.image;
        if(image == null){
            await this.interaction.reply({content: `Das Zitat mit der ID ${this.zitat_id} im Bracket mit der ID ${this.bracket_id} und der Order ID ${this.order_id} hat kein Bild`, ephemeral: true});
            return;
        }
        await this.interaction.reply({content: `${zitat.zitat.zitat} - ${zitat.zitat.author} \n ${image}`, ephemeral: true});

    }
}   