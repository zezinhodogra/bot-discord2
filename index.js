require("dotenv").config();

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ========================
// ⚙️ CONFIG
// ========================
const LOG_CHANNEL = "logs-bot";
const COOLDOWN_TIME = 10000;
const TIMEOUT_TIME = 60 * 60 * 1000;

// ========================
// 🧠 NORMALIZAR TEXTO
// ========================
function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[@4]/g, "a")
        .replace(/[3]/g, "e")
        .replace(/[1!]/g, "i")
        .replace(/[0]/g, "o")
        .replace(/[^a-z\s]/g, "")
        .replace(/(.)\1+/g, "$1");
}

// ========================
// 🚫 PALAVRÕES
// ========================
const palavroes = [
    "merda","caralho","desgracado","puta","puto",
    "filho da puta","filha da puta","arrombado",
    "viado","bixa","bicha","boiola",
    "foder","foda se","nem fodendo",
    "pau","pica","punheta","trepar",
    "buceta","xoxota","sirica",
    "cacete","babaca","brocha","corno",
    "canalha","escroto","trouxa","vaca"
];

// ========================
// 📊 LEVEL + SPAM
// ========================
const levels = {};
const cooldown = {};

// ========================
// ⏱ CONVERTER TEMPO
// ========================
function parseTempo(texto) {
    const match = texto.match(/(\d+)(m|h|d)/);
    if (!match) return null;

    const valor = parseInt(match[1]);
    const tipo = match[2];

    if (tipo === "m") return valor * 60 * 1000;
    if (tipo === "h") return valor * 60 * 60 * 1000;
    if (tipo === "d") return valor * 24 * 60 * 60 * 1000;

    return null;
}

// ========================
// 🔥 BOT ONLINE
// ========================
client.once("ready", () => {
    console.log(`🔥 Bot online como ${client.user.tag}`);
});

// ========================
// 💬 EVENTO PRINCIPAL
// ========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const userId = message.author.id;

    const logChannel = message.guild.channels.cache.find(c => c.name === LOG_CHANNEL);

    // ========================
    // 📢 ANÚNCIO
    // ========================
    if (message.content.startsWith("!anuncio")) {
        if (!isAdmin) return;

        const texto = message.content.slice(9).trim();
        if (!texto) return message.reply("Escreva algo.");

        message.channel.send(`📢 **ANÚNCIO**\n${texto}`);

        if (logChannel) {
            logChannel.send(`📢 Anúncio: ${message.author.tag}`);
        }

        return;
    }

    // ========================
    // 📊 LEVEL
    // ========================
    if (message.content === "!level") {
        if (!levels[userId]) levels[userId] = { xp: 0, level: 1 };

        return message.reply(`📊 Nível: ${levels[userId].level} | XP: ${levels[userId].xp}/100`);
    }

    // ========================
    // 🚫 ANTI-SPAM
    // ========================
    if (!isAdmin) {
        const agora = Date.now();

        if (cooldown[userId] && agora - cooldown[userId] < COOLDOWN_TIME) {
            await message.delete().catch(() => {});

            if (logChannel) {
                logChannel.send(`⚠️ SPAM: ${message.author.tag}`);
            }

            return;
        }

        cooldown[userId] = agora;
    }

    // ========================
    // 🚫 PALAVRÃO
    // ========================
    if (!isAdmin) {
        const textoNormal = normalizar(message.content);

        if (palavroes.some(p => textoNormal.includes(p))) {
            await message.delete().catch(() => {});
            await message.member.timeout(TIMEOUT_TIME, "Palavrão").catch(() => {});

            message.channel.send(`🚨 ${message.author}, silenciado por 1 hora.`);

            if (logChannel) {
                logChannel.send(`🚨 PALAVRÃO: ${message.author.tag}`);
            }

            return;
        }
    }

    // ========================
    // 🚨 PUNIR
    // ========================
    if (message.content.startsWith("!punir")) {
        if (!isAdmin) return;

        const args = message.content.split(" ");
        const user = message.mentions.members.first();
        const tempoTexto = args[2] || "1h";

        if (!user) return message.reply("Marca alguém.");

        const tempo = parseTempo(tempoTexto);
        if (!tempo) return message.reply("Use: 10m, 1h ou 1d");

        await user.timeout(tempo, "Punição manual").catch(() => {});
        message.channel.send(`🚨 ${user.user.tag} punido por ${tempoTexto}`);

        if (logChannel) {
            logChannel.send(`🚨 PUNIÇÃO: ${user.user.tag} | ${tempoTexto}`);
        }

        return;
    }

    // ========================
    // ✅ DESPUNIR
    // ========================
    if (message.content.startsWith("!despunir")) {
        if (!isAdmin) return;

        const user = message.mentions.members.first();
        if (!user) return message.reply("Marca alguém.");

        await user.timeout(null).catch(() => {});
        message.channel.send(`✅ ${user.user.tag} despunido`);

        if (logChannel) {
            logChannel.send(`✅ DESPUNIÇÃO: ${user.user.tag}`);
        }

        return;
    }

    // ========================
    // 📈 LEVEL SYSTEM
    // ========================
    if (!levels[userId]) levels[userId] = { xp: 0, level: 1 };

    if (!isAdmin) {
        levels[userId].xp += 10;

        if (levels[userId].xp >= 100) {
            levels[userId].xp = 0;
            levels[userId].level++;

            message.channel.send(`🎉 ${message.author} subiu para nível ${levels[userId].level}`);
        }
    } else {
        levels[userId].level = 999;
    }
});

// ========================
// 🚀 LOGIN
// ========================
client.login(process.env.TOKEN);