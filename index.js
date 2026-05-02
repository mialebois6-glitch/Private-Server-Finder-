const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// ⚠️ fetch compatible Railway / Node 18+
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

console.log("🚀 START BOT FILE");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const PREFIX = "!";

// 🔥 CONFIG JEUX
const games = {
    bloxfruits: {
        name: "Blox Fruits",
        placeId: 2753915549,
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
        placeId: 8737899170,
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

// 🔄 rotation auto
setInterval(() => {
    for (let game in games) {
        let g = games[game];
        g.currentIndex = (g.currentIndex + 1) % g.servers.length;
    }
    console.log("🔄 Rotation serveurs OK");
}, 60000);

// 👥 joueurs Roblox
async function getPlayerCount(placeId) {
    try {
        const res = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=10`);
        const data = await res.json();

        if (!data || !data.data) return "Inconnu";

        let total = 0;
        data.data.forEach(s => total += s.playing);

        return total;
    } catch (err) {
        console.log("Erreur API Roblox:", err);
        return "Inconnu";
    }
}

// 🎮 commande
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content === PREFIX + "serveurprive") {

        const menu = new StringSelectMenuBuilder()
            .setCustomId("select_game")
            .setPlaceholder("Choisis un jeu")
            .addOptions(
                Object.keys(games).map(key => ({
                    label: games[key].name,
                    value: key
                }))
            );

        const row = new ActionRowBuilder().addComponents(menu);

        message.reply({
            content: "🎮 Choisis un jeu :",
            components: [row]
        });
    }
});

// 📌 interaction menu
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "select_game") {
        const game = games[interaction.values[0]];

        const playerCount = await getPlayerCount(game.placeId);
        const currentServer = game.servers[game.currentIndex];

        let msg =
            `🎮 **${game.name}**\n\n` +
            `👥 Joueurs (public) : ${playerCount}\n\n` +
            `🔒 Serveur privé actuel :\n👉 ${currentServer}\n\n` +
            `🔄 Rotation auto active`;

        interaction.reply({ content: msg });
    }
});

// ✅ READY EVENT (IMPORTANT DEBUG)
client.once("ready", () => {
    console.log(`✅ CONNECTÉ EN TANT QUE ${client.user.tag}`);
});

// 🚨 LOGIN (IMPORTANT)
console.log("🔑 Connexion Discord...");

// 👉 RAILWAY: TOKEN doit exister dans Variables
client.login(process.env.TOKEN);
