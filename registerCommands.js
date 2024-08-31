const { REST, Routes } = require("discord.js");
require("dotenv").config();
const token = process.env.TOKEN;
const clientID = process.env.CLIENT_ID;
const commands = [
  {
    name: "userphone",
    description: "Connect to another user on Discord via the bot",
  },
  {
    name: "disconnect",
    description: "Disconnect from the userphone connection",
  },
];

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands globally.");

    await rest.put(Routes.applicationCommands(clientID), { body: commands });

    console.log("Successfully reloaded application (/) commands globally.");
  } catch (error) {
    console.error(error);
  }
})();
