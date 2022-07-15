# DHBW Discord Bot

Discord Bot um dualis-Daten und andere infos abzurufen

# Prerequisites

* Discord-Bot (https://discord.com/developers/docs/intro)
* node + npm

# Konfiguration

Um den Bot nutzen zu können, müssen folgende Umgebungsvariablen gesetzt sein:

```.env
DISCORD_TOKEN=<DISCORD_API_TOKEN>
DUALIS_USER=<Dualis Username xxxxx@hb.dhbw-stuttgart.de>
DUALIS_PASSWORD=<Dualis Password>
```

# Installation

```
  npm run build
  npm start
```

# Deployment

Mithilfe von [heroku](https://dashboard.heroku.com/) kann die App ganz einfach deployt werden.
Dazu, einfach dieses Repository forken, eine neue heroku App erstellen, GitHub-Deployment auswählen und das richtige Repository auswählen.

# Features

## Implementiert:

* Stundenplan anzeige (/stundenplan)
