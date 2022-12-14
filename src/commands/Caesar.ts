import { BaseCommandInteraction, Client } from 'discord.js';
import { Command } from "../types/command";






export const Caesar: Command = {
    name: "caesar",
    description: "Caesar Chiffre",
    type: "CHAT_INPUT",
    options: [
        {
            name: "text",
            description: "Text der verschlüsselt werden soll",
            type: "STRING",
            required: true
        },
        {
            name: "key",
            description: "Schlüssel",
            type: "INTEGER",
            required: true
        }
    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        
        const chiffre = caesarChiffre(interaction.options.get("text")?.value as string, interaction.options.get("key")?.value! as number);

        await interaction.reply({ content: chiffre });
       
    }
};


function caesarChiffre(test:string, key:number){
    
    let result = "";
    for(let i = 0; i < test.length; i++){
        let c = test.charCodeAt(i);
        if(c >= 65 && c <= 90){
            result += String.fromCharCode((c - 65 + key) % 26 + 65);
        }else if(c >= 97 && c <= 122){
            result += String.fromCharCode((c - 97 + key) % 26 + 97);
        }else{
            result += test.charAt(i);
        }
    }
    return result;

}