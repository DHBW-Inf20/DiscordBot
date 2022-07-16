# Neue Slash-Commands hinzufügen

in `src/commands/` eine neue Datei erstellen und dort ein `Command`-Objekt erstellen. Die run-Methode wird beim aufrufen ausgeführt.
Jeder Command muss jedoch zunächst in `src/Commands` registriert werden (einfach in den Array packen)

Für mehr Informationen zu `discord.js`: https://discordjs.guide/

# Auto Deploy für den Server?

Der Hoster für den Bot aufm Inf20-Dc hat leider keine gescheite git-Integration um eine CI/CD-Pipeline zu implementieren, aber gerne jederzeit ne Pull-Request machen, dann sehe ich Änderungen und kann den Bot updaten.
