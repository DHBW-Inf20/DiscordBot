import { BaseCommandInteraction, ButtonInteraction, MessageActionRow,  MessageButton, MessageEmbed, MessageAttachment } from "discord.js";
import { Intranet } from "../interfaces/horbintranet";
import dba from "./databaseAdapter";
import { StundenplanCanvas } from "./stundenplanCanvas";
import { randomUUID } from 'crypto';


const constantButtonRow = new MessageActionRow().addComponents([
    new MessageButton().setCustomId('previousWeek').setLabel('<< Vorherige Woche').setStyle('SECONDARY'),
    new MessageButton().setCustomId('nextWeek').setLabel('Nächste Woche >>').setStyle('SECONDARY')
])



interface stundenPlanHandler {

    sendStundenplan: () => Promise<void>;

}

class StundenPlanHandler implements stundenPlanHandler {


    course: string = "";
    weekOffset: number = 0;
    interaction: BaseCommandInteraction | undefined = undefined;
    id: string = "";
    currentTimeout: NodeJS.Timeout | undefined = undefined;

    init = async (interaction: BaseCommandInteraction) => {


        this.weekOffset = (interaction.options.get("woche")?.value || this.weekOffset) as number;

        let dbUser = await dba.getInstance().getUser(interaction.user.id);
        if (!dbUser) {
            interaction.reply({ content: "Dein Discord-Account ist noch nicht verifiziert und es fehlt eine Kurs-Zuordnung. Bitte verifiziere deinen Account mit dem Befehl `/verify <ixxxx>` und versuche es erneut.", ephemeral: true });
            return;
        }

        this.interaction = interaction;
        this.course = "HOR-T" + dbUser.course;
        
        await interaction.deferReply();

        await this.sendStundenplan();

        return this;

    }

    catch(error: any) {
        console.error(error);
        if (!this.interaction) return;
        this.interaction.editReply({ content: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.", components: [] });

    }

    async nextWeek(buttonInteraction?: ButtonInteraction) {
        this.weekOffset++;
        await this.sendStundenplan(buttonInteraction);
    }

    async previousWeek(buttonInteraction?: ButtonInteraction) {
        this.weekOffset--;
        await this.sendStundenplan(buttonInteraction);
    }

    async sendStundenplan(buttonInteraction?: ButtonInteraction) {
            const interaction = buttonInteraction || this.interaction;
            if(buttonInteraction){
                await buttonInteraction.deferReply();
                const originalMessageId = buttonInteraction.message.id;
                const originalMessage = await buttonInteraction.channel?.messages.fetch(originalMessageId);
                if(!originalMessage) return;
                originalMessage.deletable && originalMessage.delete();
            }
            if (!interaction) return;

            const stundenplan = await Intranet.getInstance().getStundenplan(this.course, this.weekOffset).catch(this.catch);
            if (!stundenplan) return;

            
            if(Object.keys(stundenplan).length === 0){
                await interaction.editReply({
                    content: "https://tenor.com/view/free-dave-chappelle-celebrate-finally-freedom-gif-4581850",
                    components: [constantButtonRow]
                }).catch(this.catch);
            }

            const stundenplanCanvas = new StundenplanCanvas(stundenplan);
            stundenplanCanvas.renderCanvas();


            

            const attachment = new MessageAttachment(stundenplanCanvas.getBuffer(), `stundenplan.png`);
            attachment.id = randomUUID();
    
            // Create a embed with the attachment
            const embed = new MessageEmbed()
                .setTitle(`Stundenplan für ${this.course}`)
                .setDescription(`KW ${stundenplan.meta.kw}`)
                .setTimestamp()
                .setImage(`attachment://${attachment.name}`)
                .setColor(0x771100)
                .setFooter({text: `Angefragt von ${interaction.user.username}`, iconURL: interaction.user.avatarURL() || undefined});

            let message = await interaction.editReply({ embeds:[embed], components: [constantButtonRow], files: [attachment] }).catch(this.catch);

            if(!message) return;
            stundenPlanMap.delete(this.id);
            stundenPlanMap.set(message.id, this);

            // Delete the handler after 10 minutes
            const minutes = 10;
            this.currentTimeout && clearTimeout(this.currentTimeout);
            this.currentTimeout = setTimeout(() => {
                stundenPlanMap.delete(this.id);
            }, (1000 * 60) * minutes);
            this.id = message.id;
    }

}




// Holds all the current stundenplan handler Objects
const stundenPlanMap = new Map<string, StundenPlanHandler>();

export async function newStundenplanHandler(interaction: BaseCommandInteraction) : Promise<string> {

    const handler = await new StundenPlanHandler().init(interaction);
    if(!handler) return "";
    return handler.id;
}

export function getStundenplanHandler(id: string) : StundenPlanHandler | undefined {
    return stundenPlanMap.get(id);
}

export default stundenPlanMap;



