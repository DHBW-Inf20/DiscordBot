# DHBW Discord Bot

Discord Bot to fetch some information for the DHBW Horb Students

## Prerequisites

* Discord-Bot [https://discord.com/developers/docs/intro](https://discord.com/developers/docs/intro)
* node + npm
* Typescript
* MongoDB

## Configuration

You need to create a .env file to configure the bot. The .env file needs to be in the root directory of the project.

A empty .env file looks like this:

```.env

# Mandatory environment vars

DISCORD_TOKEN=<Discord bot token> (https://discord.com/developers/applications)
DISCORD_MAIN_GUILD=<Discord-server id>
DISCORD_VERIFY_CHANNEL=<Discord channel id>
DISCORD_ROLES_CHANNEL=<Discord channel id>

# You can get a free cluster at https://www.mongodb.com/cloud/atlas
DB_HOST=<mongodb host>
DB_USER=<mongodb username>
DB_PASSWORD=<mongodb password>
DB_NAME=<mongodb database name>

# Nedded to send emails for verification
EMAIL_USER=<email server user>
EMAIL_PASSWORD=<email server password>
EMAIL_HOST=<email server host>
EMAIL_PORT=<email server port>
EMAIL_SECURE=<use secure connection (true/false)>
EMAIL_FROM=<email sender address>

SUPPORT_USER_ID=<Discord user id> (The user id of the user that should be notified if theres something wrong with the bot)


# Optional environment vars

# Needed to fetch weather information (https://openweathermap.org/api) Its free
OPEN_WEATHER_KEY=<your key> 

# Needed for the chat bot to work (https://openai.com/) Its not free but you get a lot of starter credits and for normal use it is basically free but optional
OPEN_AI_KEY=<your key>


# Needed to fetch schedule information from horb intranet
INTRANET_USER=<intranet username [ixxxxx]>
INTRANET_PASSWORD=<intranet password> (Is used to get schedule information)

# Debugging
DEV=true
DEBUG=true
```

## Installation

You can just run the install command, everything else should be done automatically

```bash
  npm install
```

## Features

* Verify users with their DHBW email address
* fetch schedule information
* fetch information on the lunch menu
* chat bot
* voting system
* small other features

## How to extend the bot

The main structure is divided into 2 folders.

The commands folder holds different Commands that you can define and register in `Commands.ts`.

The listener folder holds different listeners that can be used to listen to different events (e.g. messageReaction, ButtonListener, etc.).

The main file is `Bot.ts` which is the entry point of the bot.

```bash
│   Bot.ts
│   Commands.ts
├───commands
└───listeners
```
