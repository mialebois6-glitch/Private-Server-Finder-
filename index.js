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
const LOG_CHANNEL_ID = "1501255907089322246";
const BOOSTER_ROLE_ID = "1501255314475974807";

// ================= DATA =================

let games = {};
let xpData = {};
let xpCooldown = {};
let dashboardMessageId = null;

try {
    games = JSON.parse(fs.readFileSync("./games.json"));
} catch {}

try {
    xpData = JSON.parse(fs.readFileSync("./xp.json"));
} catch {}

try {
    dashboardMessageId =
        JSON.parse(fs.readFileSync("./dashboard.json")).id;
} catch {}

// ================= SAVE =================

const saveXP = () =>
    fs.writeFileSync(
        "./xp.json",
        JSON.stringify(xpData, null, 2)
    );

const saveDashboard = () =>
    fs.writeFileSync(
        "./dashboard.json",
        JSON.stringify({ id: dashboardMessageId })
    );

// ================= LOG =================

async function log(userTag, gameName, link) {

    try {

        const ch =
            await client.channels.fetch(
                LOG_CHANNEL_ID
            );

        await ch.send({
            content:
`user: \`@${userTag}\`
game : \`${gameName}\`
link : \`${link}\``
        });

    } catch (err) {

        console.log(err);
    }
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

    const channel =
        await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setTitle("🚀 Private Server Finder")
        .setDescription(
            [
                "🎮 Choisis un jeu ci-dessous",
                "⚡ Accès instantané"
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

    const row =
        new ActionRowBuilder().addComponents(menu);

    try {

        if (dashboardMessageId) {

            const msg =
                await channel.messages.fetch(
                    dashboardMessageId
                );

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
            i.member.roles.cache.has(
                BOOSTER_ROLE_ID
            );

        const serverLink =
            game.servers?.[0] ||
            "https://roblox.com";

        // ================= LOG FORMAT =================

        await log(
            i.user.tag,
            game.name,
            serverLink
        );

        // ================= RESPONSE =================

        return i.reply({

            embeds: [
                new EmbedBuilder()
                    .setTitle(`🚀 ${game.name}`)
                    .setDescription(
                        [
                            isBooster
                                ? "✅ Accès booster"
                                : "✅ Accès disponible",
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
                        .setURL(serverLink)
                )
            ],

            ephemeral: true
        });
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
    }

    saveXP();
});
// ================= NUKE COMMAND =================

client.on("messageCreate", async (msg) => {

    if (msg.author.bot) return;

    if (msg.content === "!nuke8") {

        // TON ID DISCORD
        if (msg.author.id !== "1405171984475754628") {

            return msg.reply({
                content: "SLP TU PEUX PAS 😂"
            });
        }

        try {

            const oldChannel = msg.channel;

            // clone le salon
            const newChannel =
                await oldChannel.clone();

            // même position
            await newChannel.setPosition(
                oldChannel.position
            );

            // supprime l'ancien
            await oldChannel.delete();

            // message dans le nouveau salon
            await newChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Nuked je vous bz les bot ")
                        .setDescription(
                            `Salon recréé par <@${msg.author.id}>`
                        )
                        .setColor(0xff0000)
                ]
            });

        } catch (err) {

            console.log(err);
        }
    }
});
// ================= LOGIN =================

client.login(process.env.TOKEN);
