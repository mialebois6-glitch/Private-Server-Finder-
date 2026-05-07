const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
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

// ================= DATA =================

let games = {};
let monthly = {};
let xpData = {};
let xpCooldown = {};
let leaderboardMessageId = null;
let dashboardMessageId = null;

try { games = JSON.parse(fs.readFileSync("./games.json")); } catch {}
try { monthly = JSON.parse(fs.readFileSync("./monthly.json")); } catch {}
try { xpData = JSON.parse(fs.readFileSync("./xp.json")); } catch {}
try { leaderboardMessageId = JSON.parse(fs.readFileSync("./leaderboard.json")).id; } catch {}
try { dashboardMessageId = JSON.parse(fs.readFileSync("./dashboard.json")).id; } catch {}

// ================= SAVE =================

const saveXP = () => fs.writeFileSync("./xp.json", JSON.stringify(xpData, null, 2));

const saveLeaderboard = () =>
    fs.writeFileSync(
        "./leaderboard.json",
        JSON.stringify({ id: leaderboardMessageId })
    );

const saveDashboard = () =>
    fs.writeFileSync(
        "./dashboard.json",
        JSON.stringify({ id: dashboardMessageId })
    );

// ================= LOG =================

async function log(message) {
    try {
        const ch = await client.channels.fetch(LOG_CHANNEL_ID);
        await ch.send({ content: message });
    } catch {}
}

// ================= XP =================

function getLevel(xp) {
    return Math.floor(0.1 * Math.sqrt(xp));
}

function getXP(id) {
    if (!xpData[id]) {
        xpData[id] = {
            xp: 0,
            level: 0
        };
    }

    return xpData[id];
}

// ================= DASHBOARD =================

async function sendDashboard() {

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle("🚀 Private Server Finder")
        .setDescription(
            [
                "🎮 Choisis un jeu ci-dessous",
                "⚡ Boosters = accès instantané",
                "⏳ Non boosters = attente 1 à 5 minutes"
            ].join("\n")
        )
        .addFields(
            {
                name: "📊 Status",
                value: "🟢 Online",
                inline: true
            },
            {
                name: "🎮 Jeux",
                value: `${Object.keys(games).length}`,
                inline: true
            }
        )
        .setColor(0x5865F2);

    const menu = new StringSelectMenuBuilder()
        .setCustomId("select_game")
        .setPlaceholder("🎮 Choisir un jeu")
        .addOptions(
            Object.keys(games).map(k => ({
                label: games[k].name,
                value: k
            }))
        );

    const row = new ActionRowBuilder().addComponents(menu);

    try {

        if (dashboardMessageId) {

            const msg = await channel.messages.fetch(dashboardMessageId);

            await msg.edit({
                embeds: [embed],
                components: [row]
            });

        } else {

            const msg = await channel.send({
                embeds: [embed],
                components: [row]
            });

            dashboardMessageId = msg.id;

            saveDashboard();
        }

    } catch {

        const msg = await channel.send({
            embeds: [embed],
            components: [row]
        });

        dashboardMessageId = msg.id;

        saveDashboard();
    }
}

// ================= READY =================

client.on("clientReady", async () => {

    console.log(`✅ ${client.user.tag}`);

    await sendDashboard();

    await updateLeaderboard();
});

// ================= INTERACTIONS =================

client.on("interactionCreate", async (i) => {

    if (
        i.isStringSelectMenu() &&
        i.customId === "select_game"
    ) {

        const game = games[i.values[0]];

        if (!game) {
            return i.reply({
                content: "❌ Jeu introuvable",
                ephemeral: true
            });
        }

        const isBooster =
            i.member.roles.cache.has(BOOSTER_ROLE_ID);

        log(`🎮 ${i.user.tag} a sélectionné ${game.name}`);

        // ================= BOOSTER =================

        if (isBooster) {

            return i.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`🚀 ${game.name}`)
                        .setDescription(
                            [
                                "✅ Accès instantané booster",
                                "",
                                "🔗 Clique sur le bouton ci-dessous"
                            ].join("\n")
                        )
                        .setColor(0x00ffcc)
                ],

                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel("🚀 Join Server")
                            .setStyle(ButtonStyle.Link)
                            .setURL(
                                game.servers?.[0] ||
                                "https://roblox.com"
                            )
                    )
                ],

                ephemeral: true
            });
        }

        // ================= NON BOOSTER =================

        const waitMinutes =
            Math.floor(Math.random() * 5) + 1;

        await i.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⏳ Accès en attente")
                    .setDescription(
                        [
                            "🚫 Tu n'es pas booster",
                            "",
                            `⏱️ Temps d'attente : ${waitMinutes} minute(s)`,
                            "",
                            "🚀 Boost le serveur pour obtenir un accès instantané"
                        ].join("\n")
                    )
                    .setColor(0xffaa00)
            ],
            ephemeral: true
        });

        // attente
        setTimeout(async () => {

            try {

                await i.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`🎮 ${game.name}`)
                            .setDescription(
                                [
                                    "✅ Ton accès est prêt",
                                    "",
                                    "🔗 Clique sur le bouton ci-dessous"
                                ].join("\n")
                            )
                            .setColor(0x00ffcc)
                    ],

                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setLabel("🎮 Join Server")
                                .setStyle(ButtonStyle.Link)
                                .setURL(
                                    game.servers?.[0] ||
                                    "https://roblox.com"
                                )
                        )
                    ],

                    ephemeral: true
                });

            } catch (err) {
                console.error("❌ Erreur followUp :", err);
            }

        }, waitMinutes * 60 * 1000);
    }
});

// ================= XP =================

const XP_PER_MESSAGE = 10;
const XP_COOLDOWN = 10000;

client.on("messageCreate", async (msg) => {

    if (msg.author.bot) return;

    const id = msg.author.id;

    if (
        xpCooldown[id] &&
        Date.now() < xpCooldown[id]
    ) return;

    xpCooldown[id] =
        Date.now() + XP_COOLDOWN;

    const user = getXP(id);

    user.xp += XP_PER_MESSAGE;

    const newLevel = getLevel(user.xp);

    if (newLevel > user.level) {

        user.level = newLevel;

        msg.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎉 Level Up")
                    .setDescription(
                        `<@${id}> est niveau **${newLevel}**`
                    )
                    .setColor(0xFFD700)
            ]
        });

        log(
            `📈 ${msg.author.tag} est passé niveau ${newLevel}`
        );
    }

    saveXP();
});

// ================= LEADERBOARD =================

async function updateLeaderboard() {

    try {

        const sorted = Object.entries(monthly)
            .sort((a, b) => b[1].boosts - a[1].boosts)
            .slice(0, 10);

        const medals = ["🥇", "🥈", "🥉"];

        const desc = sorted.map((u, i) => {

            let badge =
                medals[i] || `**${i + 1}.**`;

            if (i === 0) {
                return `👑 ${badge} <@${u[0]}> • 🚀 **${u[1].boosts}**`;
            }

            return `${badge} <@${u[0]}> • 🚀 ${u[1].boosts}`;

        }).join("\n");

        const embed = new EmbedBuilder()
            .setTitle("📊 Leaderboard LIVE")
            .setDescription(desc || "Aucun booster")
            .setColor(0x00ffcc);

        const ch =
            await client.channels.fetch(
                LEADERBOARD_CHANNEL_ID
            );

        let msg = null;

        if (leaderboardMessageId) {

            try {

                msg =
                    await ch.messages.fetch(
                        leaderboardMessageId
                    );

            } catch (err) {

                if (err.code === 10008) {

                    console.log(
                        "⚠️ Leaderboard supprimé, recréation..."
                    );

                    leaderboardMessageId = null;

                } else {
                    throw err;
                }
            }
        }

        if (!msg) {

            msg = await ch.send({
                embeds: [embed]
            });

            leaderboardMessageId = msg.id;

            saveLeaderboard();

            console.log(
                "✅ Nouveau leaderboard créé"
            );

        } else {

            await msg.edit({
                embeds: [embed]
            });
        }

    } catch (err) {

        console.error(
            "❌ Erreur leaderboard :",
            err
        );
    }
}

setInterval(updateLeaderboard, 30000);

// ================= LOGIN =================

client.login(process.env.TOKEN);
