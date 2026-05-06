const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");

// ================= CONFIG =================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const CHANNEL_ID = "1501253385888727040";
const LEADERBOARD_CHANNEL_ID = "1501455908847222886";
const LOG_CHANNEL_ID = "1501255907089322246";
const BOOSTER_ROLE_ID = "1501255314475974807";

// 🎯 XP CONFIG
const XP_PER_MESSAGE = 10;
const XP_COOLDOWN = 10000;

const LEVEL_ROLES = {
    5: "ROLE_ID_LEVEL_5",
    10: "ROLE_ID_LEVEL_10",
    20: "ROLE_ID_LEVEL_20"
};

const LOCK_DURATION = 10 * 60 * 1000;
const LOCK_PRICE = 500;
const MAX_TEAM_SIZE = 5;
const BOOST_REWARD = 1000;

// ================= DATA =================

let games = {};
let boosts = {};
let monthly = {};
let xpData = {};
let xpCooldown = {};
let leaderboardMessageId = null;

try { games = JSON.parse(fs.readFileSync("./games.json")); } catch {}
try { boosts = JSON.parse(fs.readFileSync("./boosts.json")); } catch {}
try { monthly = JSON.parse(fs.readFileSync("./monthly.json")); } catch {}
try { xpData = JSON.parse(fs.readFileSync("./xp.json")); } catch {}
try {
    const data = JSON.parse(fs.readFileSync("./leaderboard.json"));
    leaderboardMessageId = data.id;
} catch {}

// ================= SAVE =================

const saveGames = () => fs.writeFileSync("./games.json", JSON.stringify(games, null, 2));
const saveBoosts = () => fs.writeFileSync("./boosts.json", JSON.stringify(boosts, null, 2));
const saveMonthly = () => fs.writeFileSync("./monthly.json", JSON.stringify(monthly, null, 2));
const saveXP = () => fs.writeFileSync("./xp.json", JSON.stringify(xpData, null, 2));
const saveLeaderboard = () => fs.writeFileSync("./leaderboard.json", JSON.stringify({ id: leaderboardMessageId }));

// ================= XP SYSTEM =================

function getLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

function getXP(id) {
    if (!xpData[id]) xpData[id] = { xp: 0, level: 0 };
    return xpData[id];
}

// ================= COINS =================

function getCoins(id) {
    if (!boosts[id]) boosts[id] = { coins: 0, boosts: 0 };
    return boosts[id].coins;
}

function addCoins(id, amount) {
    if (!boosts[id]) boosts[id] = { coins: 0, boosts: 0 };
    boosts[id].coins += amount;
    saveBoosts();
}

function removeCoins(id, amount) {
    boosts[id].coins -= amount;
    saveBoosts();
}

// ================= EMBED =================

function createEmbed(game) {
    return new EmbedBuilder()
        .setTitle(`🎮 ${game.name}`)
        .setColor(0x5865F2)
        .addFields(
            { name: "🔐 Lock", value: game.locked ? "Oui" : "Non", inline: true },
            { name: "👑 Leader", value: game.lockLeader ? `<@${game.lockLeader}>` : "Aucun", inline: true },
            { name: "👥 Team", value: `${game.lockOwners?.length || 0}/${MAX_TEAM_SIZE}`, inline: true }
        );
}

// ================= BUTTONS =================

function createButtons(key, link) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🔗 Join").setStyle(ButtonStyle.Link).setURL(link),
        new ButtonBuilder().setLabel("🔐 Lock").setStyle(ButtonStyle.Danger).setCustomId(`lock_${key}`),
        new ButtonBuilder().setLabel("➕ Team").setStyle(ButtonStyle.Secondary).setCustomId(`add_${key}`),
        new ButtonBuilder().setLabel("➖ Remove").setStyle(ButtonStyle.Secondary).setCustomId(`remove_${key}`)
    );
}

// ================= READY =================

client.on("clientReady", async () => {
    console.log(`✅ ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    const menu = new StringSelectMenuBuilder()
        .setCustomId("select_game")
        .setPlaceholder("🎮 Choisir un jeu")
        .addOptions(
            Object.keys(games).map(k => ({
                label: games[k].name,
                value: k
            }))
        );

    await channel.send({
        content: "🎮 Choisis un jeu",
        components: [new ActionRowBuilder().addComponents(menu)]
    });
});

// ================= XP MESSAGE =================

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;

    const id = msg.author.id;

    if (xpCooldown[id] && Date.now() < xpCooldown[id]) return;
    xpCooldown[id] = Date.now() + XP_COOLDOWN;

    const user = getXP(id);
    user.xp += XP_PER_MESSAGE;

    const newLevel = getLevel(user.xp);

    if (newLevel > user.level) {
        user.level = newLevel;

        const embed = new EmbedBuilder()
            .setTitle("🎉 Level Up !")
            .setDescription(`🔥 <@${id}> est niveau **${newLevel}**`)
            .setColor(0xFFD700);

        msg.channel.send({ embeds: [embed] });

        const roleId = LEVEL_ROLES[newLevel];
        if (roleId) {
            const role = msg.guild.roles.cache.get(roleId);
            if (role) msg.member.roles.add(role).catch(() => {});
        }
    }

    saveXP();
});

// ================= LEADERBOARD =================

async function updateLeaderboard() {
    const sorted = Object.entries(monthly)
        .sort((a, b) => b[1].boosts - a[1].boosts)
        .slice(0, 10);

    const medals = ["🥇", "🥈", "🥉"];

    const desc = sorted.map((u, i) => {
        let badge = medals[i] || `**${i + 1}.**`;
        if (i === 0) return `👑 ${badge} <@${u[0]}> • 🚀 **${u[1].boosts}**`;
        return `${badge} <@${u[0]}> • 🚀 ${u[1].boosts}`;
    }).join("\n");

    const embed = new EmbedBuilder()
        .setTitle("📊 Leaderboard LIVE")
        .setDescription(desc || "Aucun booster")
        .setColor(0x00ffcc);

    const ch = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);

    if (!leaderboardMessageId) {
        const msg = await ch.send({ embeds: [embed] });
        leaderboardMessageId = msg.id;
        saveLeaderboard();
    } else {
        const msg = await ch.messages.fetch(leaderboardMessageId);
        msg.edit({ embeds: [embed] });
    }
}

setInterval(updateLeaderboard, 30000);

// ================= LOGIN =================

client.login(process.env.TOKEN);
