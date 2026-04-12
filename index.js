require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Quando o bot liga
client.on('ready', () => {
    console.log(`✅ Logado como ${client.user.tag}`);
});

// Quando alguém entra no servidor
client.on('guildMemberAdd', (member) => {
    const cargo = member.guild.roles.cache.find(r => r.name === "Novo jogador");

    if (cargo) {
        member.roles.add(cargo);
        console.log(`Cargo dado para ${member.user.tag}`);
    } else {
        console.log("❌ Cargo 'Novo jogador' não encontrado");
    }
});

// Comando simples
client.on('messageCreate', (message) => {
    if (message.content === '!ping') {
        message.reply('Pong 🏓');
    }
});

// LOGIN (IMPORTANTE)
client.login(process.env.TOKEN);