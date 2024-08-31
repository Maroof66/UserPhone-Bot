# Userphone Bot

![Feature GIF](https://i.imgur.com/3Dser8C.gif)



Userphone Bot is a simple Discord bot that allows users to connect with others across different channels and guilds, simulating a "phone call" experience. The bot handles connections, allowing users to chat through the bot's interface.

## Setup

To get started with the Userphone Bot, you'll need to set up a few things:

### Prerequisites

- **Node.js**: Make sure you have Node.js installed. You can download it [here](https://nodejs.org/).
- **Discord Developer Portal**: You'll need a bot token and the Client ID from the Discord Developer Portal. If you don't have a bot yet, you can create one [here](https://discord.com/developers/applications).

### .env File

Create a `.env` file in the root directory of your project. This file will hold your bot's token and client ID. Here's the template:
```
TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
```

Replace `your_bot_token_here` and `your_client_id_here` with your actual bot token and client ID.

### Enabling Intents

To ensure your bot works correctly, you'll need to enable specific intents in the Discord Developer Portal:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your bot application.
3. Under the **"Bot"** section, scroll down to the **"Privileged Gateway Intents"**.
4. Enable the following intents:
   - **Message Content Intent**: Allows the bot to read message content.
   - **Guild Members Intent**: Allows the bot to read guild member updates.
   - **Guilds Intent**: Allows the bot to read guild information.

### Installation

After setting up the `.env` file, you can install the required dependencies:
```
npm install
```
Additionally, you'll need to install `better-sqlite3`, which is used for efficient database management:
```
npm install better-sqlite3
```


### Running the Bot

Once everything is set up, start the bot using the following command:

```
node index.js
```

## Features

- **Cross-Guild Communication**: Connects users from different guilds.
- **Simple Commands**: Easily connect and disconnect with the `/userphone` and `/disconnect` commands.
- **Queue System**: If no user is available, the bot will queue your request and connect you once another user uses `/userphone`.

