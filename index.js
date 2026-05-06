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
        GatewayIntentBits.GuildMembers
    ]
});

const CHANNEL_ID = "1501253385888727040";
const LOG_CHANNEL_ID = "1501255907089322246";
const BOOSTER_ROLE_ID = "1501255314475974807";

const LOCK_DURATION = 10 * 60 * 1000;
const LOCK_PRICE = 500;
const MAX_TEAM_SIZE = 5;
const BOOST_REWARD = 1000;

// ================= DATA =================

let games = {};
let boosts = {};
let monthly = {};
let leaderboardMessageId = null;

try { games = JSON.parse(fs.readFileSync("./games.json")); } catch {}
try { boosts = JSON.parse(fs.readFileSync("./boosts.json")); } catch {}
try { monthly = JSON.parse(fs.readFileSync("./monthly.json")); } catch {}

// ================= SAVE =================

const saveGames = () => fs.writeFileSync("./games.json", JSON.stringify(games, null, 2));
const saveBoosts = () => fs.writeFileSync("./boosts.json", JSON.stringify(boosts, null, 2));
const saveMonthly = () => fs.writeFileSync("./monthly.json", JSON.stringify(monthly, null, 2));

// ================= LOG =================

async function log(msg) {
    try {
        const ch = await client.channels.fetch(LOG_CHANNEL_ID);
        if (ch) ch.send(msg);
    } catch {}
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

    try {
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

    } catch (e) {
        console.log("READY error", e);
    }
});

// ================= BOOST + ROLE =================

client.on("guildMemberUpdate", async (oldM, newM) => {
    try {
        const had = oldM.premiumSince;
        const has = newM.premiumSince;

        const role = newM.guild.roles.cache.get(BOOSTER_ROLE_ID);

        // 🚀 BOOST
        if (!had && has) {

            addCoins(newM.id, BOOST_REWARD);

            if (!monthly[newM.id]) monthly[newM.id] = { boosts: 0 };
            monthly[newM.id].boosts++;

            if (!boosts[newM.id]) boosts[newM.id] = { coins: 0, boosts: 0 };
            boosts[newM.id].boosts++;

            saveMonthly();
            saveBoosts();

            if (role) {
                await newM.roles.add(role).catch(() => {});
            }

            log(`🚀 ${newM.user.tag} boost + rôle`);
        }

        // ❌ STOP BOOST
        if (had && !has) {
            if (role) {
                await newM.roles.remove(role).catch(() => {});
            }

            log(`❌ ${newM.user.tag} stop boost`);
        }

    } catch (e) {
        console.log("boost error", e);
    }
});

// ================= INTERACTIONS =================

client.on("interactionCreate", async (i) => {
    try {

        if (i.isStringSelectMenu() && i.customId === "select_game") {
            const key = i.values[0];
            const game = games[key];
            const link = game.servers?.[0] || "https://roblox.com";

            return i.reply({
                embeds: [createEmbed(game)],
                components: [createButtons(key, link)],
                ephemeral: true
            });
        }

        if (i.isButton() && i.customId.startsWith("lock_")) {
            const key = i.customId.replace("lock_", "");
            const game = games[key];
            const id = i.user.id;

            if (game.locked) return i.reply({ content: "🔒 déjà lock", ephemeral: true });

            const booster = i.member.premiumSince;

            if (!booster && getCoins(id) < LOCK_PRICE) {
                return i.reply({ content: "💰 pas assez coins", ephemeral: true });
            }

            if (!booster) removeCoins(id, LOCK_PRICE);

            game.locked = true;
            game.lockLeader = id;
            game.lockOwners = [id];
            game.lockUntil = Date.now() + LOCK_DURATION;

            saveGames();

            return i.reply({ content: "🔐 lock actif", ephemeral: true });
        }

        if (i.isButton() && i.customId.startsWith("add_")) {
            const key = i.customId.replace("add_", "");
            const game = games[key];

            if (game.lockLeader !== i.user.id) {
                return i.reply({ content: "👑 leader only", ephemeral: true });
            }

            const menu = new UserSelectMenuBuilder()
                .setCustomId(`add_user_${key}`)
                .setPlaceholder("Choisir joueur");

            return i.reply({
                components: [new ActionRowBuilder().addComponents(menu)],
                ephemeral: true
            });
        }

        if (i.isUserSelectMenu()) {
            const key = i.customId.replace("add_user_", "");
            const game = games[key];
            const target = i.values[0];

            if (game.lockOwners.includes(target)) {
                return i.reply({ content: "déjà team", ephemeral: true });
            }

            if (game.lockOwners.length >= MAX_TEAM_SIZE) {
                return i.reply({ content: "team full", ephemeral: true });
            }

            game.lockOwners.push(target);
            saveGames();

            return i.update({
                content: `✅ <@${target}> ajouté`,
                components: []
            });
        }

    } catch (err) {
        console.log("interaction error", err);
    }
});

// ================= AUTO UNLOCK =================

setInterval(() => {
    const now = Date.now();

    for (const k in games) {
        const g = games[k];
        if (g.locked && now >= g.lockUntil) {
            g.locked = false;
            g.lockLeader = null;
            g.lockOwners = [];
        }
    }

    saveGames();
}, 5000);

// ================= LEADERBOARD LIVE =================

async function updateLeaderboard() {
    try {
        const sorted = Object.entries(monthly)
            .sort((a, b) => b[1].boosts - a[1].boosts)
            .slice(0, 10);

        const desc = sorted.map((u, i) =>
            `**${i + 1}.** <@${u[0]}> • 🚀 ${u[1].boosts}`
        ).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("📊 Leaderboard LIVE")
            .setDescription(desc || "Aucun booster")
            .setColor(0x00ffcc);

        const ch = await client.channels.fetch(CHANNEL_ID);

        if (!leaderboardMessageId) {
            const msg = await ch.send({ embeds: [embed] });
            leaderboardMessageId = msg.id;
        } else {
            const msg = await ch.messages.fetch(leaderboardMessageId);
            msg.edit({ embeds: [embed] });
        }

    } catch {}
}

setInterval(updateLeaderboard, 30000);

// ================= RESET MENSUEL =================

setInterval(async () => {
    const d = new Date();

    if (d.getDate() === 1 && d.getHours() === 0) {

        const sorted = Object.entries(monthly)
            .sort((a, b) => b[1].boosts - a[1].boosts)
            .slice(0, 3);

        const rewards = [5000, 3000, 1000];

        sorted.forEach(([id], i) => addCoins(id, rewards[i]));

        monthly = {};
        saveMonthly();

        log("🏆 récompenses mensuelles envoyées");
    }

}, 60 * 60 * 1000);

// ================= LOGIN =================

client.login(process.env.TOKEN);
