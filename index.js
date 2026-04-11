require("dotenv").config();
const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const badWords = ["porra", "merda", "caralho", "fdp"];

client.on("ready", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  const canal = member.guild.channels.cache.find(c => c.name === "bem-vindo");
  if (canal) canal.send(`👋 Bem-vindo ${member}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (badWords.some(word => content.includes(word))) {
    await message.delete();

    try {
      await message.member.timeout(24 * 60 * 60 * 1000, "Palavrão");
      message.channel.send(`🚫 ${message.author} foi silenciado.`);
    } catch (err) {
      console.log("Erro:", err);
    }
  }
});

client.login(TOKEN);
