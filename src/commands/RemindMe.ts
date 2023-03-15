import {
    Client,
    BaseCommandInteraction,
    Modal,
    MessageActionRow,
    TextInputComponent,
    ModalActionRowComponent,
} from 'discord.js';
import { Command } from '../types/command';
import { randomUUID } from 'crypto';
import VerificationHandler from '../misc/verificationHandler';
import { verifyMap } from '../Bot';
import Verifier from '../misc/EmailClient';
import dba from '../misc/databaseAdapter';



export const RemindMe: Command = {
    name: "remindme",
    options: [
        {
            name: "message",
            description: "Nachricht, die du dir merken möchtest",
            type: "STRING",
            required: false,
        },
        {
            name: "hours",
            description: "Zeit in Stunden, nach der du erinnert werden möchtest",
            type: "INTEGER",
            required: false
        },
        {
            name: "minutes",
            description: "Zeit in Minuten, nach der du erinnert werden möchtest",
            type: "INTEGER",
            required: false,
        },
    ],
    description: "Erinnert dich nach einer bestimmten Zeit an etwas",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Open the file neske.txt
        let user = interaction.user;
        let minutes = interaction.options.get("minutes")?.value as number || 0;

        let hours = interaction.options.get("hours")?.value as number || 0;

        minutes += hours * 60;

        if (minutes == 0) {
            minutes = 60;
        }
        
        let message = interaction.options.get("message")?.value as string || "Ping!";

        let channel = interaction.channel;

        let goalDate = new Date(new Date().getTime() + minutes * 60000);

        let timeDiff = new Date(goalDate.getTime() - new Date().getTime());

        // Send a message to the channel in n minutes
        interaction.reply({ ephemeral: true, content: `Ich werde dich erinnern am ${goalDate.getDate()}.${goalDate.getMonth()}.${goalDate.getFullYear()} um ${goalDate.getHours()}:${goalDate.getMinutes()} (${timeDiff.getHours()}h, ${timeDiff.getMinutes()}m)` });
        setTimeout(() => {
            console.log("Sending reminder");
            channel?.send(`<@${user.id}> Erinnerung:\n${message}`);
        }, minutes * 60000);


    }
};


// random 6 character string
function randomString(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
