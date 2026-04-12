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
    "arrombado","otario"
];

const avisos = new Map();
const mensagensUsuario = new Map();

// nome do canal de logs
const LOG_CHANNEL = "logs-bot";

// ================= FUNÇÕES =================

// normalização hardcore
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
        .replace(/\s+/g, " ");
}

// IA simples (detecção de ofensa sem palavrão)
function detectarOfensa(msg) {
    return (
        msg.includes("vai se") ||
        msg.includes("seu lixo") ||
        msg.includes("idiota") ||
        msg.includes("burro") ||
        msg.includes("se mata") ||
        msg.includes("lixo")
    );
}

// spam/flood
function detectarSpam(userId) {
    const agora = Date.now();
    const limite = 5000; // 5s

    if (!mensagensUsuario.has(userId)) {
        mensagensUsuario.set(userId, []);
    }

    const msgs = mensagensUsuario.get(userId);
    msgs.push(agora);

    // remove antigas
    while (msgs.length && msgs[0] < agora - limite) {
        msgs.shift();
    }

    return msgs.length >= 5; // 5 msgs em 5s
}

// log
function log(guild, texto) {
    const canal = guild.channels.cache.find(c => c.name === LOG_CHANNEL);
    if (canal) canal.send(texto);
}

// ================= EVENTOS =================

client.on('ready', () => {
    console.log(`🔥 Bot online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    const original = message.content;
    const msg = normalizar(original);

    const temPalavra = palavrasProibidas.some(p => msg.includes(p));
    const ofensaIA = detectarOfensa(msg);
    const spam = detectarSpam(message.author.id);

    // ================= ADMIN =================
    if (isAdmin) {
        if (temPalavra || ofensaIA) {
            await message.delete().catch(()=>{});
            message.channel.send(`⚠️ ${message.author}, cuidado com a linguagem.`);
        }
        return;
    }

    // ================= MEMBROS =================

    if (temPalavra || ofensaIA || spam) {

        await message.delete().catch(()=>{});

        const id = message.author.id;
        avisos.set(id, (avisos.get(id) || 0) + 1);
        const total = avisos.get(id);

        // log
        log(message.guild, `🚨 ${message.author.tag} | Aviso ${total}`);

        // resposta
        message.channel.send(`🚫 ${message.author}, aviso ${total}/3`);

        // punições
        if (spam) {
            await message.member.timeout(60 * 60 * 1000); // 1h
            message.channel.send(`🔇 ${message.author} mutado por spam (1h)`);
            log(message.guild, `🔇 ${message.author.tag} mutado por SPAM`);
            avisos.set(id, 0);
            return;
        }

        if (total >= 3) {
            await message.member.timeout(60 * 60 * 1000); // 1h
            message.channel.send(`🔇 ${message.author} mutado por 1 hora.`);
            log(message.guild, `🔇 ${message.author.tag} mutado (3 avisos)`);
            avisos.set(id, 0);
        }
    }
});

// login
client.login(process.env.TOKEN);