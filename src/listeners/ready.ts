import { config } from "../Bot";
import { Client, GuildChannel, TextChannel } from "discord.js";
import { Commands } from "../Commands";
export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        // Register slash-Commands
        await client.application.commands.set(Commands);
        console.log(`${client.user.username} is online`);
        let channel = client.channels.cache.get(config!.discord.verification_channel)! as TextChannel;
        channel.bulkDelete(100);
        channel.send("Bot is online");
    });
};


