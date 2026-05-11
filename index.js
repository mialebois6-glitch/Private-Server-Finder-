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

// ⚠️ MET TON ID DISCORD ICI
const OWNER_ID = "1405171984475754628";

// ================= DATA =================

let games = {};
let dashboardMessageId = null;

try {
    games = JSON.parse(
        fs.readFileSync("./games.json")
    );
} catch {}

try {
    dashboardMessageId =
        JSON.parse(
            fs.readFileSync("./dashboard.json")
        ).id;
} catch {}

// ================= SAVE =================

const saveDashboard = () =>
    fs.writeFileSync(
        "./dashboard.json",
        JSON.stringify({
            id: dashboardMessageId
        })
    );

// ================= LOG =================

async function log(userId, gameName, link) {

    try {

        const ch =
            await client.channels.fetch(
                LOG_CHANNEL_ID
            );

        await ch.send({
            content:
`user: <@${userId}>
game : \`${gameName}\`
link : ||${link}||`
        });

    } catch (err) {

        console.log(err);
    }
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

            const msg =
                await channel.send({
                    embeds: [embed],
                    components: [row]
                });

            dashboardMessageId = msg.id;

            saveDashboard();
        }

    } catch {

        const msg =
            await channel.send({
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

        // ================= LOG =================

        await log(
            i.user.id,
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

// ================= NUKE COMMAND =================

client.on("messageCreate", async (msg) => {

    if (msg.author.bot) return;

    if (msg.content === "!nuke8") {

        if (msg.author.id !== OWNER_ID) {

            return msg.reply({
                content:
                    "❌ Tu ne peux pas utiliser cette commande."
            });
        }

        try {

            const oldChannel = msg.channel;

            // clone salon
            const newChannel =
                await oldChannel.clone();

            // même position
            await newChannel.setPosition(
                oldChannel.position
            );

            // supprime ancien salon
            await oldChannel.delete();

            // message nouveau salon
            await newChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("💥 Salon Nuked")
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
