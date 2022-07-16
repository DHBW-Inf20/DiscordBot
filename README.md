# DHBW Discord Bot

Discord Bot um dualis-Daten und andere infos abzurufen

# Prerequisites

* Discord-Bot (https://discord.com/developers/docs/intro)
* node + npm

# Konfiguration

Um den Bot nutzen zu können, müssen folgende Umgebungsvariablen gesetzt sein:

```.env
DISCORD_TOKEN=<DISCORD_API_TOKEN>
DISCORD_ZITATE_CHANNEL=<CHANNEL_ID indem Zitate gespeichert werden>
DUALIS_USER=<Dualis Username xxxxx@hb.dhbw-stuttgart.de>
DUALIS_PASSWORD=<Dualis Password>
```

# Installation

```
  npm install
```

# Features

## Implementiert:

* Stundenplan anzeige (/stundenplan)
* Speiseplan des Studierendenwerk Stuttgarts anzeigen
* Zitate per Kontext-Menü speichern
