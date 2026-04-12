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

const LOG_CHANNEL = "logs-bot";

const avisos = new Map();
const mensagensUsuario = new Map();
const niveis = new Map();

// ================= FUNÇÕES =================

// normalizar texto
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

// IA simples de ofensa
function detectarOfensa(msg) {
    return (
        msg.includes("vai se") ||
        msg.includes("seu lixo") ||
        msg.includes("idiota") ||
        msg.includes("burro") ||
        msg.includes("lixo")
    );
}

// spam
function detectarSpam(userId) {
    const agora = Date.now();
    const limite = 5000;

    if (!mensagensUsuario.has(userId)) {
        mensagensUsuario.set(userId, []);
    }

    const msgs = mensagensUsuario.get(userId);
    msgs.push(agora);

    while (msgs.length && msgs[0] < agora - limite) {
        msgs.shift();
    }

    return msgs.length >= 5;
}

// LOG (FUNCIONA EM QUALQUER CATEGORIA)
function log(guild, texto) {
    const canal = guild.channels.cache.find(
        c => c.name === LOG_CHANNEL && c.isTextBased()
    );

    if (!canal) {
        console.log("❌ Canal logs-bot não encontrado");
        return;
    }

    canal.send(texto).catch(() => {
        console.log("❌ Erro ao enviar log");
    });
}

// XP
function adicionarXP(userId) {
    if (!niveis.has(userId)) {
        niveis.set(userId, { xp: 0, level: 1 });
    }

    const user = niveis.get(userId);

    user.xp += Math.floor(Math.random() * 10) + 5;

    const xpNecessario = user.level * 100;

    if (user.xp >= xpNecessario) {
        user.xp = 0;
        user.level++;
        return true;
    }

    return false;
}

// ================= EVENTOS =================

client.on('ready', () => {
    console.log(`🔥 Bot online: ${client.user.tag}`);
});

// cargo automático
client.on('guildMemberAdd', (member) => {
    const cargo = member.guild.roles.cache.find(r => r.name === "Novo jogador");
    if (cargo) member.roles.add(cargo);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);

    const original = message.content;
    const msg = normalizar(original);

    // ================= LEVEL =================

    if (!isAdmin) {
        const subiu = adicionarXP(message.author.id);

        if (subiu) {
            message.channel.send(`🎉 ${message.author} subiu de nível!`);
        }
    }

    if (original === "!level") {
        if (isAdmin) {
            return message.reply("👑 Você é nível máximo.");
        }

        const user = niveis.get(message.author.id);

        if (!user) {
            return message.reply("Você ainda não tem nível.");
        }

        return message.reply(`📊 Level: ${user.level} | XP: ${user.xp}`);
    }

    // ================= MODERAÇÃO =================

    const temPalavra = palavrasProibidas.some(p => msg.includes(p));
    const ofensaIA = detectarOfensa(msg);
    const spam = detectarSpam(message.author.id);

    // ADMIN (só aviso)
    if (isAdmin) {
        if (temPalavra || ofensaIA) {
            await message.delete().catch(()=>{});
            message.channel.send(`⚠️ ${message.author}, cuidado com a linguagem.`);
        }
        return;
    }

    // MEMBROS
    if (temPalavra || ofensaIA || spam) {

        await message.delete().catch(()=>{});

        const id = message.author.id;
        avisos.set(id, (avisos.get(id) || 0) + 1);
        const total = avisos.get(id);

        message.channel.send(`🚫 ${message.author}, aviso ${total}/3`);

        log(message.guild, `🚨 ${message.author.tag} | Aviso ${total}`);

        // spam = mute direto
        if (spam) {
            await message.member.timeout(60 * 60 * 1000);
            message.channel.send(`🔇 ${message.author} mutado por spam (1h)`);
            log(message.guild, `🔇 ${message.author.tag} mutado por SPAM`);
            avisos.set(id, 0);
            return;
        }

        // 3 avisos = mute
        if (total >= 3) {
            await message.member.timeout(60 * 60 * 1000);
            message.channel.send(`🔇 ${message.author} mutado por 1 hora.`);
            log(message.guild, `🔇 ${message.author.tag} mutado (3 avisos)`);
            avisos.set(id, 0);
        }
    }
});

// login
client.login(process.env.TOKEN);