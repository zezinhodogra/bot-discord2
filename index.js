require('dotenv').config();

const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= CONFIG =================

const palavrasProibidas = [
    "porra","caralho","fdp","puta","merda",
    "fuder","fudido","cu","bosta","desgraça",
    "arrombado","otario","viado","vai se fuder",
    "vai tomar no cu"
];

// sistema de warnings
const avisos = new Map();

// ================= FUNÇÕES =================

// normaliza texto (anti-bypass)
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[@4]/g, "a")
        .replace(/[3]/g, "e")
        .replace(/[1!]/g, "i")
        .replace(/[0]/g, "o")
        .replace(/[$5]/g, "s")
        .replace(/[7]/g, "t")
        .replace(/[^a-z0-9 ]/g, "")
        .replace(/\s+/g, " "); // remove espaços extras
}

// verifica palavras
function contemPalavra(msg) {
    return palavrasProibidas.some(p => msg.includes(p));
}

// ================= EVENTOS =================

// BOT ONLINE
client.on('ready', () => {
    console.log(`🔥 Bot online: ${client.user.tag}`);
});

// CARGO AUTOMÁTICO
client.on('guildMemberAdd', (member) => {
    const cargo = member.guild.roles.cache.find(r => r.name === "Novo jogador");
    if (cargo) member.roles.add(cargo);
});

// MENSAGENS
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // ADM IGNORADO
    if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return;
    }

    const original = message.content;
    const msg = normalizar(original);

    // DETECTA PALAVRÃO
    if (contemPalavra(msg)) {

        await message.delete().catch(() => {});

        const id = message.author.id;

        // adiciona aviso
        avisos.set(id, (avisos.get(id) || 0) + 1);
        const total = avisos.get(id);

        // resposta
        const avisoMsg = await message.channel.send(
            `🚫 ${message.author}, sem palavrão! (${total}/3)`
        );

        setTimeout(() => avisoMsg.delete().catch(()=>{}), 4000);

        // ================= PUNIÇÕES =================

        if (total === 2) {
            message.channel.send(`⚠️ ${message.author} último aviso.`);
        }

        // 3 avisos = timeout
        if (total >= 3) {
            try {
                await message.member.timeout(10 * 60 * 1000); // 10 min
                message.channel.send(`🔇 ${message.author} mutado por 10 minutos.`);
                avisos.set(id, 0);
            } catch {
                console.log("Erro ao mutar");
            }
        }

        return;
    }

    // COMANDO TESTE
    if (original === '!ping') {
        message.reply('Pong 🏓');
    }
});

// LOGIN
client.login(process.env.TOKEN);