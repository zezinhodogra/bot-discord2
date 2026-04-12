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

// Lista de palavrões (pode editar)
const palavrasProibidas = [
    "porra",
    "caralho",
    "fdp",
    "puta",
    "merda"
];

// Quando o bot liga
client.on('ready', () => {
    console.log(`✅ Logado como ${client.user.tag}`);
});

// Cargo automático
client.on('guildMemberAdd', (member) => {
    const cargo = member.guild.roles.cache.find(r => r.name === "Novo jogador");

    if (cargo) {
        member.roles.add(cargo);
    }
});

// Mensagens
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    // FILTRO DE PALAVRÃO
    if (palavrasProibidas.some(p => msg.includes(p))) {
        await message.delete();

        message.channel.send(`🚫 ${message.author}, sem palavrão aqui!`);

        return;
    }

    // Comando
    if (msg === '!ping') {
        message.reply('Pong 🏓');
    }
});

// Login
client.login(process.env.TOKEN);