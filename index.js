const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// 📂 IMPORT JSON
const games = require("./games.json");

// 🔥 ajouter index dynamique
for (let key in games) {
    games[key].currentIndex = 0;
}

// 🔥 SALON
const CHANNEL_ID = "1500023726089965628";

// 🔄 rotation serveurs
setInterval(() => {
    for (let g in games) {
        const game = games[g];
        game.currentIndex = (game.currentIndex + 1) % game.servers.length;
    }
    console.log("🔄 Rotation effectuée");
}, 60000);

// 🔒 statut serveur privé
function getPrivateStatus() {
    return {
        text: "🔒 Serveur privé Roblox",
        color: 0x5865F2
    };
}

// 🚀 READY
client.on("clientReady", async () => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    const channel = await client.channels.fetch(CHANNEL_ID);

    const menu = new StringSelectMenuBuilder()
        .setCustomId("select_game")
        .setPlaceholder("🎮 Choisis un jeu")
        .addOptions(
            Object.keys(games).map(key => ({
                label: games[key].name,
                value: key
            }))
        );

    const row = new ActionRowBuilder().addComponents(menu);

    await channel.send({
        content: " # 🎮 **Choisis un jeu pour voir le serveur privé : ||@everyone||**",
        components: [row]
    });
});

// 🎮 INTERACTIONS
client.on("interactionCreate", async (interaction) => {

    // MENU
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "select_game") {

            const gameKey = interaction.values[0];
            const game = games[gameKey];

            const server = game.servers[game.currentIndex];
            const status = getPrivateStatus();

            const embed = new EmbedBuilder()
                .setTitle(`🎮 ${game.name}`)
                .setColor(status.color)
                .addFields(
                    { name: "📡 Statut", value: status.text },
                    { name: "👥 Joueurs", value: "❌ Non détectable" },
                    { name: "🔗 Serveur", value: "Clique sur le bouton ci-dessous" }
                )
                .setFooter({ text: "Private Server Finder 🚀" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 Rejoindre serveur")
                    .setStyle(ButtonStyle.Link)
                    .setURL(server),

                new ButtonBuilder()
                    .setLabel("🔄 Actualiser")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`refresh_${gameKey}`)
            );

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }
    }

    // REFRESH
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("refresh_")) {

            const gameKey = interaction.customId.replace("refresh_", "");
            const game = games[gameKey];

            const server = game.servers[game.currentIndex];
            const status = getPrivateStatus();

            const embed = new EmbedBuilder()
                .setTitle(`🎮 ${game.name} (Actualisé)`)
                .setColor(status.color)
                .addFields(
                    { name: "📡 Statut", value: status.text },
                    { name: "👥 Joueurs", value: "❌ Non détectable" },
                    { name: "🔗 Serveur", value: "Clique sur le bouton ci-dessous" }
                )
                .setFooter({ text: "Private Server Finder 🚀" });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🔗 Rejoindre serveur")
                    .setStyle(ButtonStyle.Link)
                    .setURL(server),

                new ButtonBuilder()
                    .setLabel("🔄 Actualiser")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`refresh_${gameKey}`)
            );

            await interaction.update({
                embeds: [embed],
                components: [row]
            });
        }
    }
});

// 🔑 LOGIN
client.login(process.env.TOKEN);
