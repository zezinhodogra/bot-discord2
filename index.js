require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ✅ CORRETO
const TOKEN = process.env.TOKEN;

// DEBUG (pode remover depois)
console.log("TOKEN:", TOKEN);

if (!TOKEN) {
  console.log("❌ TOKEN NÃO DEFINIDO");
  process.exit(1);
}

// palavras proibidas
const badWords = ["porra", "merda", "caralho", "fdp"];

// BOT ONLINE
client.on("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

// BOAS VINDAS
client.on("guildMemberAdd", async (member) => {
  const canal = member.guild.channels.cache.find(
    (c) => c.name === "bem-vindo"
  );

  if (canal) {
    canal.send(`👋 Bem-vindo ${member} ao servidor!`);
  }
});

// MODERAÇÃO
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  if (badWords.some((word) => content.includes(word))) {
    await message.delete();

    try {
      await message.member.timeout(
        24 * 60 * 60 * 1000,
        "Falou palavrão"
      );

      message.channel.send(
        `🚫 ${message.author} foi silenciado por 1 dia.`
      );
    } catch (err) {
      console.log("Erro:", err);
    }
  }
});

client.login(TOKEN);