import { zitateMap } from '../Bot';
import { Client, BaseCommandInteraction, ContextMenuInteraction, Modal, MessageActionRow, TextInputComponent, ModalActionRowComponent, ApplicationCommandOptionData } from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import {  ContextMenuCommand } from "../types/command";
import fs from 'fs';
import { Command } from './../types/command';
import sqlite3 from 'sqlite3';
import { SlashCommandBuilder } from '@discordjs/builders';


let cmd = new SlashCommandBuilder().setName("neske").setDescription("Erhöt einen Counter der trackt wie hoft neske schon \"In Anführungszeichen\" gesagt hat").addIntegerOption(option =>
    option.setName("type")
        .setDescription("Welcher Counter soll hoch gehen?")
        .setRequired(false)
        .addChoices(
            { value: 0, name: "Ich sach mal" },
            { value: 1, name: "Anführungszeichen" }
        ));


export const Neske: Command = {
    name: "neske",
    description: "Erhöt einen Counter der trackt wie hoft neske schon \"In Anführungszeichen\" gesagt hat",
    options: [
        {
            name: "n",
            description: "Zahl um mehr oder weniger hinzuzufügen",
            type: "INTEGER",
            required: false
        },
        (cmd.options[0] as unknown as ApplicationCommandOptionData)

    ],
    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Open the file neske.txt
        await interaction.deferReply();
        let n:number = interaction.options.get("n")?.value as number || 1;
        let counter = 0;
        let type = interaction.options.get("type")?.value as number || 0;
        let typeString = type == 0 ? "sach" : "zeichen";
        // Get the saved counter in the sqlite database and add 1
        const db = new sqlite3.Database('./neske.db');
        db.get(`SELECT * FROM neskecounter WHERE name = \'${typeString}\'`, async (err, row) => {
            if (err) {
                console.log(err);
            }
            console.log(counter, row);
            if (row) {
                counter = row.counter + n;
            }
            // Save the new counter in the sqlite database where name is neskecounter

            db.run(`UPDATE neskecounter SET counter = ? WHERE name = \'${typeString}\'`, counter, async (err) => {
                if (err) {
                    console.log(err);
                }
                // Send the new counter to the user
                await interaction.followUp({ content: `Neske hat schon ${counter} mal \"${type == 0 ? "Ich sach mal" : "In Anführungszeichen"}\" gesagt!` });
            });
        });
    }
};