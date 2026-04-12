require("dotenv").config();

const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // IMPORTANTE PRO BEM VINDO
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
});

// ========================
// 📊 LEVEL
// ========================
let levels = {};

// ========================
// 🚫 PALAVRÕES
// ========================
const palavroes = [
    "fuder", "fudido", "carai", "bosta", "cu",
    "vai se fuder", "vai tomar no cu"
];

// ========================
// 🎉 BEM VINDO
// ========================
client.on("guildMemberAdd", member => {
    const canal = member.guild.channels.cache.find(c => c.name === "bem-vindo");

    if (!canal) return;

    canal.send(`🎉 Bem-vindo ${member} ao servidor! Aproveite! 🚀`);
});

// ========================
// 💬 EVENTO
// ========================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    // ========================
    // 📢 ANÚNCIO
    // ========================
    if (message.content.startsWith("!anuncio")) {
        if (!isAdmin) return message.reply("❌ Só admin.");

        const texto = message.content.slice(9).trim();
        if (!texto) return message.reply("❌ Escreva algo.");

        message.channel.send(`📢 **ANÚNCIO**\n${texto}`);
        return;
    }

    // ========================
    // 📊 LEVEL COMANDO
    // ========================
    if (message.content === "!level") {
        if (message.channel.name !== "sistema-de-níveis") {
            return message.reply("❌ Use no canal correto.");
        }

        const userId = message.author.id;

        if (!levels[userId]) {
            levels[userId] = { xp: 0, level: 1 };
        }

        message.reply(`📊 Nível: ${levels[userId].level} | XP: ${levels[userId].xp}`);
        return;
    }

    // ========================
    // 🚫 PALAVRÃO
    // ========================
    if (!isAdmin) {
        const texto = message.content.toLowerCase();

        if (palavroes.some(p => texto.includes(p))) {
            await message.delete().catch(() => {});
            message.channel.send(`🚫 ${message.author}, sem palavrão!`)
                .then(msg => setTimeout(() => msg.delete(), 3000));
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

    if (isAdmin) {
        levels[userId].level = 999;
        return;
    }

    levels[userId].xp += 10;

    if (levels[userId].xp >= 100) {
        levels[userId].xp = 0;
        levels[userId].level++;

        message.channel.send(`🎉 ${message.author} subiu para o nível ${levels[userId].level}!`);
    }

    // ========================
    // 📜 LOGS (canal logs-bot)
    // ========================
    const logChannel = message.guild.channels.cache.find(c => c.name === "logs-bot");

    if (logChannel) {
        logChannel.send(`📜 ${message.author.tag} falou: ${message.content}`);
    }
});

client.login(process.env.TOKEN);