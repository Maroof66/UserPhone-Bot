const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const { QuickDB } = require("quick.db");
require("dotenv").config();

const db = new QuickDB();
const token = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
    ],
});

client.commands = new Collection();
require("./registerCommands");

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(checkWaitingMessages, 3000);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, channel, guildId } = interaction;
    const channelId = channel.id;

    if (commandName === "userphone") {
        const existingConnection = await db.get(`connection_${channelId}`);
        if (existingConnection) {
            return interaction.reply({
                content: "This channel is already connected to another channel!",
                ephemeral: true,
            });
        }

        const waitingChannelEntry = await db.get(`waitingChannel_${channelId}`);
        if (waitingChannelEntry) {
            return interaction.reply({
                content: "This channel is already waiting for connection!",
                ephemeral: true,
            });
        }

        const waitingChannels = await db.all();
        const waitingChannelFromOtherGuild = waitingChannels.find((entry) =>
            entry.id.startsWith("waitingChannel_") && entry.value.guildId !== guildId
        );

        if (waitingChannelFromOtherGuild) {
            const { channelId: waitingChannelId, messageId } = waitingChannelFromOtherGuild.value;
            const waitingChannelInstance = client.channels.cache.get(waitingChannelId);
            if (waitingChannelInstance) {
                try {
                    await db.set(`connection_${channelId}`, { channelId: waitingChannelId });
                    await db.set(`connection_${waitingChannelId}`, { channelId });
                    await db.delete(`waitingChannel_${waitingChannelId}`);

                    if (messageId) {
                        const waitingChannelMessage = await waitingChannelInstance.messages.fetch(messageId);
                        if (waitingChannelMessage) {
                            await waitingChannelMessage.edit("**Connected**");
                        }
                    }

                    interaction.reply("A channel from a different guild picked up! You are now connected! Start chatting!");
                    waitingChannelInstance.send("A channel from a different guild picked up! You are now connected! Start chatting!");
                } catch (error) {
                    console.error("Error connecting channels:", error);
                }
            } else {
                interaction.reply("Error: Waiting channel not found.");
            }
        } else {
            try {
                const sentMessage = await interaction.reply({
                    content: `Waiting for another channel to connect... Waiting time remaining: <t:${Math.floor((Date.now() + 30 * 1000) / 1000)}:R>`,
                    fetchReply: true,
                });
                await db.set(`waitingChannel_${channelId}`, {
                    channelId,
                    guildId,
                    timestamp: Date.now(),
                    messageId: sentMessage.id,
                });
            } catch (error) {
                console.error("Error sending waiting message:", error);
            }
        }
    } else if (commandName === "disconnect") {
        const channelConnection = await db.get(`connection_${channelId}`);
        const waitingChannel = await db.get(`waitingChannel_${channelId}`);
        let disconnected = false;

        if (channelConnection) {
            const { channelId: connectedChannelId } = channelConnection;
            const connectedChannel = client.channels.cache.get(connectedChannelId);
            if (connectedChannel) {
                try {
                    await db.delete(`connection_${channelId}`);
                    await db.delete(`connection_${connectedChannelId}`);
                    interaction.reply("The call has been disconnected.");
                    connectedChannel.send("The call has been disconnected.");
                    disconnected = true;
                } catch (error) {
                    console.error("Error disconnecting channels:", error);
                }
            }
        }

        if (waitingChannel && waitingChannel.channelId === channelId) {
            try {
                await db.delete(`waitingChannel_${channelId}`);
                if (!disconnected) {
                    interaction.reply("This channel was waiting and has now been removed from the queue.");
                }
                disconnected = true;
            } catch (error) {
                console.error("Error removing waiting channel:", error);
            }
        }

        if (!disconnected) {
            interaction.reply({
                content: "This channel is not connected or waiting. Use /userphone to start.",
                ephemeral: true,
            });
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const channelConnection = await db.get(`connection_${message.channel.id}`);
    if (channelConnection) {
        const { channelId } = channelConnection;
        const connectedChannel = client.channels.cache.get(channelId);
        if (connectedChannel) {
            try {
                const finalContent = message.content.replace(/https?:\/\/[^\s]+/g, "*link*");
                const embed = new EmbedBuilder()
                    .setDescription(`**${message.author.tag}:** `+ finalContent)
                    .setColor('#2e3135');

                connectedChannel.send({ embeds: [embed] });
            } catch (error) {
                console.error("Error sending embed message to connected channel:", error);
            }
        }
    }
});

async function checkWaitingMessages() {
    const waitingChannels = await db.all();
    waitingChannels.forEach(async (entry) => {
        if (entry.id.startsWith("waitingChannel_")) {
            const { channelId, timestamp, messageId } = entry.value;
            const elapsedTime = (Date.now() - timestamp) / 1000;

            if (elapsedTime > 30) {
                const waitingChannelInstance = client.channels.cache.get(channelId);
                if (waitingChannelInstance && messageId) {
                    try {
                        const messageToEdit = await waitingChannelInstance.messages.fetch(messageId);
                        if (messageToEdit) {
                            await messageToEdit.edit("No one connected. Please try again.");
                            await db.delete(`waitingChannel_${channelId}`);
                        }
                    } catch (error) {
                        console.error("Error editing waiting message:", error);
                    }
                }
            }
        }
    });
}

client.login(token);
