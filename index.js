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

// 🔥 SALON OU ENVOYER LE MENU
const CHANNEL_ID = "1500023726089965628";

// 🎮 JEUX
const games = {
    bloxfruits: {
        name: "Blox Fruits",
        servers: [
            "https://www.roblox.com/share?code=1677647989b4074b9d408089df65c7cf&type=Server",
            "https://www.roblox.com/share?code=04b19bd32cdaad46bde302f2a4d6f6d5&type=Server",
            "https://www.roblox.com/share?code=3fdc87c0150e674d93434efc2d3c5587&type=Server",
            "https://www.roblox.com/share?code=616d61bfdb341d428e4889a3165489c0&type=Server",
            "https://www.roblox.com/share?code=d1df7245e3376b4b81ca654bc842d690&type=Server",
            "https://www.roblox.com/share?code=461babda54dc74478279fd2e753ac6b0&type=Server",
            "https://www.roblox.com/share?code=3cc853405cb0014990004cfa19d36807&type=Server",
            "https://www.roblox.com/share?code=d8bff6eb5692424890d81811f7068a2f&type=Server",
            "https://www.roblox.com/share?code=bd2bafdcb679b2428026f37f6fdc6ff5&type=Server",
            "https://www.roblox.com/share?code=dbd483d752efe445b7e0d9b760629604&type=Server"
        ],
        currentIndex: 0
    },
    petssim99: {
        name: "Pets Simulator 99",
        servers: [
            "https://www.roblox.com/share?code=b9e4b4ab862c0b4b884a03b09c12ef06&type=Server",
            "https://www.roblox.com/share?code=339fd68b0e2f884798becd145d45a4df&type=Server",
            "https://www.roblox.com/share?code=be1781b740b9974d99dc8421540d2679&type=Server",
            "https://www.roblox.com/share?code=6a8345161f66fc4a8d14ead55b01ed21&type=Server",
            "https://www.roblox.com/share?code=4a223e09c2993741b838e7b06443b1ec&type=Server",
            "https://www.roblox.com/share?code=be86d94a9a1a814e9d5c7f720a113a33&type=Server",
            "https://www.roblox.com/share?code=1a7e72ceb7a9ef469bf1b0a18ce16eae&type=Server",
            "https://www.roblox.com/share?code=1bd092e54e5b82409092f591ab843534&type=Server",
            "https://www.roblox.com/share?code=6303d90d1320ed40aebe77384b8ae482&type=Server",
            "https://www.roblox.com/share?code=b72af8d6d5d7e74291161c3a95e62709&type=Server"
        ],
        currentIndex: 0
    }
};

// 🔄 rotation serveurs
setInterval(() => {
    for (let g in games) {
        const game = games[g];
        game.currentIndex = (game.currentIndex + 1) % game.servers.length;
    }
}, 60000);

// 🔒 statut serveur privé (IMPORTANT)
function getPrivateStatus() {
    return {
        text: "🔒 Serveur privé Roblox",
        color: 0x5865F2
    };
}

// 🚀 READY → envoi menu auto
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
        content: "🎮 **Choisis un jeu pour voir le serveur privé :**",
        components: [row]
    });
});

// 🎮 INTERACTIONS
client.on("interactionCreate", async (interaction) => {

    // 🎯 MENU
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
                    { name: "📡 Statut", value: status.text, inline: false },
                    { name: "👥 Joueurs", value: "❌ Non détectable (serveur privé)", inline: false },
                    { name: "🔗 Serveur", value: "Clique sur rejoindre", inline: false }
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

    // 🔄 BOUTON REFRESH
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
                    { name: "📡 Statut", value: status.text, inline: false },
                    { name: "👥 Joueurs", value: "❌ Non détectable (serveur privé)", inline: false },
                    { name: "🔗 Serveur", value: "Clique sur rejoindre", inline: false }
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
