require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN; // 👈 só isso

client.on('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

// quando alguém entra
client.on('guildMemberAdd', member => {
  const cargo = member.guild.roles.cache.find(r => r.name === "Novo jogador");

  if (cargo) {
    member.roles.add(cargo);
  }
});

client.login(TOKEN);