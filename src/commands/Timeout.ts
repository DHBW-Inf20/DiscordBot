import { ApplicationCommandOptionData, BaseCommandInteraction, Client, MessageActionRow, MessageButton, MessageEmbed, ButtonInteraction, User, Role, GuildMember, Permissions } from 'discord.js';
import { Command } from "../types/command";
import { SlashCommandBuilder } from "@discordjs/builders"
import { client, kantinenInterface } from "../Bot";
import { kantine } from "interfaces/kantine";
import { Menu } from "types/schedule";



// For some reason without the builder it has a problem creating choices...
let cmd = new SlashCommandBuilder().setName("kantine").setDescription("Zeigt den Kantineplan an").addIntegerOption(option => 
    option.setName("person")
    .setDescription("Welcher Student bekommt einen Timeout? (User-ID)")
    .setRequired(true)
);


export const Essen: Command = {
    name: "essen",
    description: "Predicted und lernt das optimale essen",
    type: "CHAT_INPUT",
    run: async (client: Client, interaction: BaseCommandInteraction) => {

        
        
       
    }
};
