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
    "cu",
    "vai tomar no cu",
    "vai se fuder",
    "vai se foder",
    "fuder",
    "foder",
    "puta que pario",
    "puta merda",
    "pariu",
    "pario"
];

// ========================
// 📊 LEVEL
// ========================
let levels = {};

// ========================
// 🎉 BEM VINDO
// ========================
client.on("guildMemberAdd", member => {
    const canal = member.guild.channels.cache.find(c => c.name === "bem-vindo");
    if (!canal) return;

    canal.send(`🎉 Bem-vindo ${member}! Aproveite o servidor 🚀`);
});

// ========================
// 💬 EVENTO PRINCIPAL
// ========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    // ========================
    // 📢 ANÚNCIO (só ADM)
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
        const userId = message.author.id;

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        message.reply(`📊 Nível: ${levels[userId].level}`);
        return;
    }

    // ========================
    // 🚫 ANTI-PALAVRÃO (SÓ MEMBRO)
    // ========================
    if (!isAdmin) {
        const textoNormal = normalizar(message.content);

        if (palavroes.some(p => textoNormal.includes(p))) {

            // 💀 BAN 1 HORA
            await message.guild.members.ban(message.author.id, {
                reason: "Palavrão proibido"
            }).catch(() => {});

            message.channel.send(`🚨 ${message.author.tag} foi banido por 1 hora.`);

            // ⏱ DESBAN APÓS 1H
            setTimeout(async () => {
                await message.guild.members.unban(message.author.id).catch(() => {});
            }, 60 * 60 * 1000);

            return;
        }
    }

    // ========================
    // 📈 LEVEL UP
    // ========================
    const userId = message.author.id;

    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 1 };
    }

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

    // ========================
    // 📜 LOGS
    // ========================
    const logChannel = message.guild.channels.cache.find(c => c.name === "logs-bot");

    if (logChannel) {
        logChannel.send(`📜 ${message.author.tag}: ${message.content}`);
    }
});

client.login(process.env.TOKEN);