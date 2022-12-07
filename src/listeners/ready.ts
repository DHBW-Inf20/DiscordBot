import { config } from "../Bot";
import { Client, TextChannel, MessageEmbed } from "discord.js";
import { Commands } from "../Commands";
export default (client: Client): void => {
    client.on("ready", async () => {
        if (!client.user || !client.application) {
            return;
        }

        console.log(`${client.user.tag} ist Online!`);
        await client.application.commands.set(Commands);
        
        if(!config!.dev) {
        // Register slash-Commands
        console.log(`${client.user.username} is online`);
        let channel = client.channels.cache.get(config!.discord.verification_channel)! as TextChannel;
        channel.bulkDelete(100);
        channel.send(
            `\`\`\`Neben der Verifizierung, werdet ihr mit /verify auch eurem Kurs zugewiesen und ihr erhaltet Zugriff auf weitere Commands wie /stundenplan.\nFalls ihr wissen wollt, was im Backend mit eurem Nutzernamen \"passiert\", könnt ihr euch in GitHub den Code genauer ansehen (https://github.com/DHBW-Inf20/DiscordBot/blob/main/src/commands/Verify.ts)\`\`\``);
        }
        // sendRoleEmbed(client); // Uncomment this line to send the role embed again
        // updateRoleEmbed(client);
    });

};

async function updateRoleEmbed(client: Client){
    let channel = client.channels.cache.get(config!.discord.roles_channel)! as TextChannel;

    let messages = await channel.messages.fetch();

    let profilFächer = messages.find(m => m.id === '1040807923854610432');
    let wahlFächer = messages.find(m => m.id === '1040807924961914932');
    let pings = messages.find(m => m.id === '1040807926824194129');

    if(profilFächer && wahlFächer && pings){

        let embed = new MessageEmbed()
            .setColor('#FF3311')
            .setTitle('Profilfächer')
            .setDescription('Software: ⌨️\nHardware: 🦾');

        await pings.edit({ embeds: [embed] });

        embed = new MessageEmbed()
            .setColor('#FF3311')
            .setTitle('Weitere Wahlfächer')
            .setDescription('C# : #️⃣\nC++: ❤️\nSeminar Informatik: 📝\nConsulting & Recht: ⚖️\nMobile Applikationen: 📱\nSprach & Bildverarbeitung: 🖼️\nKI: 🤖');

        wahlFächer.edit({ embeds: [embed] });


        embed = new MessageEmbed()
            .setColor('#2387c0')
            .setTitle('Pings')
            .setDescription(`TTT: 🚸\n CS:GO: 🔫\n Events: 🎉\n Minecraft: <:mc:1049977349002760203> \n Apex: <:ApexLegends:873216132914479165> \n League of Legends: <:leagueoflegends:941482275693010974>`);
        
        await pings.edit({ embeds: [embed] });


    }else {
        console.log('Could not find role messages...');
    }

}

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
        .setDescription('TTT: 🚸\n CS:GO: 🔫\n Events: 🎉\n Minecraft: <a:minecraft:843766809416171521> \n Apex: <:ApexLegends:873216132914479165> \n League of Legends: <:leagueoflegends:941482275693010974>');

    messageEmbed = await channel.send({ embeds: [embed] });

    messageEmbed.react('🚸');
    messageEmbed.react('🔫');
    messageEmbed.react('🎉');

    messageEmbed.react('<a:minecraft:843766809416171521>');
    messageEmbed.react('<:leagueoflegends:941482275693010974>')
    messageEmbed.react('<:ApexLegends:873216132914479165>')
}


