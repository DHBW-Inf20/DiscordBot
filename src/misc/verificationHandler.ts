
import { config } from '../Bot';
import { Base, CacheType, ModalSubmitInteraction, User } from 'discord.js';
import { BaseCommandInteraction } from 'discord.js';
import Verifier from './EmailClient';
import dba from './databaseAdapter';
interface verificationHandler {
    check: (interaction: ModalSubmitInteraction, id: string) => void;

    interaction: BaseCommandInteraction; // Initial Interaction
    dhuser: string; // User of the message
    user: User; // User of the message
    id: string; // ID of the message

}

export default class VerificationHandler implements verificationHandler {

    constructor(interaction: BaseCommandInteraction, email: string) {
        this.interaction = interaction;
        this.user = interaction.user;
        this.id = interaction.id;
        this.dhuser = email;
        this.email = email + "@hb.dhbw-stuttgart.de";
    }



    check: (interaction: ModalSubmitInteraction, id: string) => void = async (interaction: ModalSubmitInteraction, id: string) => {
        const verified = await Verifier.getInstance().verifyEmail(this.email, id);
        if (verified) {

            let course = `INF20${this.dhuser.substring(1, 3)}`
            dba.getInstance().addUser(this.dhuser, this.user.id, course);

            await interaction.reply({ ephemeral: true, content: "User erfolgreich verifiziert!" });
        } else {
            await interaction.reply({ ephemeral: true, content: `User konnte nicht verifiziert werden! Überprüfe die Eingabe und wiederhole den Vorgang, falls der Fehler weiterhinbesteht, kannst du dich bei <@${config?.support.userid}> melden` });
        }


    }
    interaction: BaseCommandInteraction; // Initial Interaction
    user: User;
    dhuser: string;
    id: string;
    email: string;

}