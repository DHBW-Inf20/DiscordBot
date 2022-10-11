import { zitateMap } from '../Bot';
import { Client, BaseCommandInteraction, ContextMenuInteraction, Modal, MessageActionRow, TextInputComponent, ModalActionRowComponent } from 'discord.js';
import ZitatHandler from '../misc/zitatHandler';
import {  ContextMenuCommand } from "../types/command";
import fs from 'fs';
import { Command } from './../types/command';
import sqlite3 from 'sqlite3';
export const Neske: Command = {
    name: "neske",
    description: "Erhöt einen Counter der trackt wie hoft neske schon \"In Anführungszeichen\" gesagt hat",

    run: async (client: Client, interaction: BaseCommandInteraction) => {
        // Open the file neske.txt
        await interaction.deferReply();
        let counter = 0;
        // Get the saved counter in the sqlite database and add 1
        const db = new sqlite3.Database('./neske.db');
        db.get('SELECT * FROM neske', async (err, row) => {
            if (err) {
                console.log(err);
            }
            console.log(counter, row);
            if (row) {
                counter = row.counter + 1;
            }
            // Save the new counter in the sqlite database
            db.run('UPDATE neske SET counter = ?', counter, async (err) => {
                if (err) {
                    console.log(err);
                }
                // Send the new counter to the user
                await interaction.followUp({ content: `Neske hat schon ${counter} mal \"In Anführungszeichen\" gesagt!` });
            });
        });
    }
};