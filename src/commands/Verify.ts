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
import VerificationHandler from './../misc/verificationHandler';
import { verifyMap } from './../Bot';
import Verifier from '../misc/EmailClient';
import dba from './../misc/databaseAdapter';



export const Verify: Command = {
    name: "verify",
    options: [
        {
            name: "user",
            description: "DHBW-Kürzel des zu verifizierenden Users",
            type: "STRING",
            required: true,
        }
    ],
    description: "Verifiziert deinen Discord-Account mit deiner Hochschulmail (Beta)",
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Open the file neske.txt
        let user = interaction.user;
        let exists = await dba.getInstance().userExists(interaction.user.id)
        if (exists) {

            interaction.reply({ ephemeral: true, content: "Du bist bereits verifiziert!" });
            return;

        }
        let dhbwUsername = interaction.options.get("user")?.value as string;
        if((/@/.test(dhbwUsername))){
            dhbwUsername = dhbwUsername.split("@")[0];
        }
        console.log(`User ${user.username}#${user.discriminator} (${user.id}) is trying to verify! with email adress: ${dhbwUsername}`);
        // Check the email for regex pattern
        const userRegex = /^(i)[0-9]{5}$/; 
        if (!userRegex.test(dhbwUsername)) {
            interaction.reply({
                ephemeral: true,
                content: "Bitte gebe ein gültiges IT-DHBW-Horb-Kürzel ein! (z.B. i20029)"
            });
            return;
        }


        let verifyId = randomString(6);
        Verifier.getInstance().sendVerificationEmail(dhbwUsername+"@hb.dhbw-stuttgart.de", verifyId, user.username);

        let interactionID = randomUUID();
        const modal = new Modal()
            .setCustomId(`verifyModal_${interactionID}`)
            .setTitle('E-Mail Verifizieren');

        // Add components to modal
        // Create the text input components
        const EmailInput = new TextInputComponent()
            .setCustomId('id')
            .setLabel("Code aus der E-Mail")
            .setRequired(true)
            .setStyle('SHORT');

        const firstActionRow = new MessageActionRow<ModalActionRowComponent>().addComponents(EmailInput);

        modal.addComponents(firstActionRow);
        verifyMap[interactionID] = new VerificationHandler(interaction, dhbwUsername);
        await interaction.showModal(modal);

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
