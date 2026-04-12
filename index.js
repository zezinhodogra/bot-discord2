require("dotenv").config();

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
});

// ========================
// 🚫 PALAVRÕES
// ========================
const palavroes = [
    "fuder",
    "fudido",
    "carai",
    "bosta",
    "cu",
    "vai se fuder",
    "vai tomar no cu"
];

// ========================
// 🧠 LEVEL SYSTEM (MEMÓRIA)
// ========================
let levels = {};

// ========================
// 💬 EVENTO PRINCIPAL
// ========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // ========================
    // 👑 ADMIN IGNORADO (LIBERADO PRA TUDO)
    // ========================
    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    // ========================
    // 📢 COMANDO ANÚNCIO (ANTES DE TUDO)
    // ========================
    if (message.content.startsWith("!anuncio")) {
        if (!isAdmin) {
            return message.reply("❌ Só admins podem usar isso.");
        }

        const texto = message.content.slice(9).trim();
        if (!texto) return message.reply("❌ Escreva o anúncio.");

        message.channel.send(`📢 **ANÚNCIO**\n${texto}`);
        return;
    }

    // ========================
    // 📊 COMANDO LEVEL
    // ========================
    if (message.content === "!level") {
        if (message.channel.name !== "sistema-de-níveis") {
            return message.reply("❌ Use esse comando no canal #sistema-de-níveis");
        }

        const userId = message.author.id;

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        message.reply(`📊 Seu nível: ${levels[userId].level} | XP: ${levels[userId].xp}`);
        return;
    }

    // ========================
    // 🚫 ANTI-PALAVRÃO (IGNORA ADMIN)
    // ========================
    if (!isAdmin) {
        const texto = message.content.toLowerCase();

        if (palavroes.some(p => texto.includes(p))) {
            await message.delete().catch(() => {});
            message.channel.send(`🚫 ${message.author}, sem palavrão aqui!`)
                .then(msg => setTimeout(() => msg.delete(), 3000));
            return;
        }
    }

    // ========================
    // 📈 SISTEMA DE LEVEL
    // ========================
    const userId = message.author.id;

    if (!levels[userId]) {
        levels[userId] = { xp: 0, level: 1 };
    }

    if (isAdmin) {
        levels[userId].level = 999; // ADMIN MAX
        return;
    }

    levels[userId].xp += 10;

    if (levels[userId].xp >= 100) {
        levels[userId].xp = 0;
        levels[userId].level++;

        message.channel.send(`🎉 ${message.author} subiu para o nível ${levels[userId].level}!`);
    }
});

client.login(process.env.TOKEN);