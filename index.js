const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const fetch = require("node-fetch");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 📂 DATA
const games = require("./games.json");
const CHANNEL_ID = "1501253385888727040";

// =======================
// ⚙️ CONFIG
// =======================

const COOLDOWN_TIME = 5000;
const GLOBAL_COOLDOWN = 1000;

const userCooldowns = new Map();
let lastGlobalUse = 0;

// =======================
// 🧠 UTILS
// =======================

async function isValidRobloxLink(url) {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.status === 200;
    } catch {
        return false;
    }
}

async function getValidServer(game) {
    let tries = 0;

    while (tries < 5) {
        const server = game.servers[Math.floor(Math.random() * game.servers.length)];

        if (await isValidRobloxLink(server)) {
            return server;
        }

        tries++;
    }

    return game.servers[0];
}

function checkCooldown(userId) {
    const now = Date.now();

    if (now - lastGlobalUse < GLOBAL_COOLDOWN) {
        return "⛔ Trop rapide";
    }

    if (userCooldowns.has(userId)) {
        const expire = userCooldowns.get(userId);

        if (now < expire) {
            const left = Math.ceil((expire - now) / 1000);
            return `⏳ Attends ${left}s`;
        }
    }

    lastGlobalUse = now;
    userCooldowns.set(userId, now + COOLDOWN_TIME);

    return null;
}

function createEmbed(game, refreshed = false) {
    return new EmbedBuilder()
        .setTitle(`🎮 ${game.name}${refreshed ? " • Actualisé" : ""}`)
        .setColor(0x5865F2)
        .setDescription("```🔒 SERVEUR PRIVÉ ROBLOX```")
        .setImage(game.image)
        .setThumbnail(game.thumbnail)
        .addFields(
            { name: "📡 Statut", value: "🟢 En ligne", inline: true },
            { name: "⚡ Accès", value: "Instantané", inline: true },
            { name: "🎯 Type", value: "Privé", inline: true }
        )
        .setFooter({ text: "Private Server Finder 🚀" })
        .setTimestamp();
}

function createButtons(gameKey, server) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setLabel("🔗 Rejoindre")
            .setStyle(ButtonStyle.Link)
            .setURL(server),

        new ButtonBuilder()
            .setLabel("📋 Copier")
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`copy_${gameKey}`),

        new ButtonBuilder()
            .setLabel("🔄 Refresh")
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`refresh_${gameKey}`)
    );
}

// =======================
// 🚀 READY
// =======================

client.on("clientReady", async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    const menu = new StringSelectMenuBuilder()
        .setCustomId("select_game")
        .setPlaceholder("🎮 Choisis un jeu")
        .addOptions(
            Object.keys(games).map(key => ({
                label: games[key].name,
                value: key,
                emoji: "🎮"
            }))
        );

    await channel.send({
        content: "## 🎮 Private Server Finder",
        components: [new ActionRowBuilder().addComponents(menu)]
    });
});

// =======================
// 🎮 INTERACTIONS
// =======================

client.on("interactionCreate", async (interaction) => {

    // MENU
    if (interaction.isStringSelectMenu()) {
        const gameKey = interaction.values[0];
        const game = games[gameKey];

        const server = await getValidServer(game);

        return interaction.reply({
            embeds: [createEmbed(game)],
            components: [createButtons(gameKey, server)],
            ephemeral: true
        });
    }

    // BUTTONS
    if (interaction.isButton()) {

        // 📋 COPY
        if (interaction.customId.startsWith("copy_")) {
            const gameKey = interaction.customId.replace("copy_", "");
            const game = games[gameKey];

            return interaction.reply({
                content: `📋 **Lien :**\n${game.lastServer || game.servers[0]}`,
                ephemeral: true
            });
        }

        // 🔄 REFRESH
        if (interaction.customId.startsWith("refresh_")) {

            const cooldown = checkCooldown(interaction.user.id);
            if (cooldown) {
                return interaction.reply({
                    content: cooldown,
                    ephemeral: true
                });
            }

            const gameKey = interaction.customId.replace("refresh_", "");
            const game = games[gameKey];

            const server = await getValidServer(game);
            game.lastServer = server;

            return interaction.update({
                content: "🔊 Nouveau serveur trouvé !",
                embeds: [createEmbed(game, true)],
                components: [createButtons(gameKey, server)]
            });
        }
    }
});

// =======================
// 🔑 LOGIN
// =======================

client.login(process.env.TOKEN);
