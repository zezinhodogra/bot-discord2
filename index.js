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

client.once("ready", () => {
    console.log(`🔥 Bot online como ${client.user.tag}`);
});

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
    "merda",
    "caralho",
    "desgracado",
    "puta",
    "puto",
    "filho da puta",
    "filha da puta",
    "arrombado",
    "preto",
    "macaco",
    "gay",
    "viado",
    "bixa",
    "bicha",
    "bicho",
    "boiola",
    "LGBT",
    "Boquete",
    "Foder",
    "foda-se",
    "nem fodendo",
    "pau",
    "pica",
    "punheta",
    "trepar",
    "buceta",
    "xoxota",
    "chochota",
    "Sirica",
    "Cacete",
    "Caceta",
    "Babaca",
    "Brocha",
    "Cracudo",
    "Galinha",
    "Piranha",
    "Corno",
    "Cachorro",
    "Cachorra",
    "Canalha",
    "Escrota",
    "Escroto",
    "Trouxa",
    "Vaca",
    "Capeta",
    "Demônio",
    "Demonio"

];

// ========================
// 📊 LEVEL
// ========================
let levels = {};

// ========================
// ⏱ ANTI-SPAM
// ========================
let cooldown = {}; // userId: timestamp

// ========================
// 💬 EVENTO PRINCIPAL
// ========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const userId = message.author.id;

    const logChannel = message.guild.channels.cache.find(c => c.name === "logs-bot");

    // ========================
    // 📢 ANÚNCIO
    // ========================
    if (message.content.startsWith("!anuncio")) {
        if (!isAdmin) return;

        const texto = message.content.slice(9).trim();
        if (!texto) return;

        message.channel.send(`📢 **ANÚNCIO**\n${texto}`);
        return;
    }

    // ========================
    // 📊 LEVEL
    // ========================
    if (message.content === "!level") {
        if (!levels[userId]) levels[userId] = { xp: 0, level: 1 };
        return message.reply(`📊 Nível: ${levels[userId].level}`);
    }

    // ========================
    // 🚫 ANTI-SPAM (MEMBROS)
    // ========================
    if (!isAdmin) {
        const agora = Date.now();

        if (cooldown[userId] && agora - cooldown[userId] < 10000) {
            await message.delete().catch(() => {});

            if (logChannel) {
                logChannel.send(`⚠️ SPAM: ${message.author.tag}`);
            }

            return;
        }

        cooldown[userId] = agora;
    }

    // ========================
    // 🚫 PALAVRÃO → TIMEOUT 1H
    // ========================
    if (!isAdmin) {
        const textoNormal = normalizar(message.content);

        if (palavroes.some(p => textoNormal.includes(p))) {
            await message.delete().catch(() => {});

            // ⏱ timeout (1 hora)
            await message.member.timeout(60 * 60 * 1000, "Palavrão").catch(() => {});

            message.channel.send(`🚨 ${message.author} foi silenciado por 1 hora.`);

            if (logChannel) {
                logChannel.send(`🚨 PALAVRÃO: ${message.author.tag} → timeout 1h`);
            }

            return;
        }
    }

    // ========================
    // 📈 LEVELS
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

client.login(process.env.TOKEN);