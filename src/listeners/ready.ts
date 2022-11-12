import { config } from "../Bot";
import { Client, DiscordAPIError, GuildChannel, TextChannel, MessageEmbed } from "discord.js";
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
        channel.send(
            `\`\`\`Neben der Verifizierung, werdet ihr mit /verify auch eurem Kurs zugewiesen und ihr erhaltet Zugriff auf weitere Commands wie /stundenplan.\nFalls ihr wissen wollt, was im Backend mit eurem Nutzernamen \"passiert\", könnt ihr euch inGitHub den Code genauer ansehen (https://github.com/DHBW-Inf20/DiscordBot/blob/main/src/commands/Verify.ts)\`\`\``);

        // sendRoleEmbed(client); // Uncomment this line to send the role embed (ik its bad)

    });

};

async function sendRoleEmbed(client: Client) {

    let channel = client.channels.cache.get(config!.discord.roles_channel)! as TextChannel;
    channel.bulkDelete(100);

    channel.send(`\`\`\`Hier könnt ihr euch selbst Rollen vergeben um gegebenenfalls besser Leute aus anderen Semestern zu finden, falls ihr gezielt Fragen zu einem Thema habt.\`\`\``)

    let embed = new MessageEmbed()
        .setColor('#FF3311')
        .setTitle('Profilfächer')
        .setDescription('Software: ⌨️\nHardware: 🦾');

    let messageEmbed = await channel.send({ embeds: [embed] });

    messageEmbed.react('⌨️');
    messageEmbed.react('🦾');

    embed = new MessageEmbed()
        .setColor('#FF3311')
        .setTitle('Weitere Wahlfächer')
        .setDescription('C# : #️⃣\nC++: ❤️\nSeminar Informatik: 📝\nConsulting & Recht: ⚖️\nMobile Applikationen: 📱\nSprach & Bildverarbeitung: 🖼️\nKI: 🤖');

    messageEmbed = await channel.send({ embeds: [embed] });

    messageEmbed.react('#️⃣');
    messageEmbed.react('❤️');
    messageEmbed.react('📝');
    messageEmbed.react('⚖️');
    messageEmbed.react('📱');
    messageEmbed.react('🖼️');
    messageEmbed.react('🤖');

    channel.send(`\`\`\`Wir versuchen immer mal wieder ein paar Leute für eine abendliche TTT/CS:GO/Phasmophobia-Lobby zu finden, falls ihr generell Lust habt, könnt Ihr euch die Rollen zuteilen, damit Ihr Pings bekommt.\`\`\``)

    embed = new MessageEmbed()
        .setColor('#2387c0')
        .setTitle('Pings')
        .setDescription('TTT: 🚸\n CS:GO: 🔫\n Events: 🎉');

    messageEmbed = await channel.send({ embeds: [embed] });

    messageEmbed.react('🚸');
    messageEmbed.react('🔫');
    messageEmbed.react('🎉');
}


