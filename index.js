const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const PREFIX = "!";

// 🔥 CONFIG JEUX
const games = {
    bloxfruits: {
        name: "Blox Fruits",
        placeId: 2753915549,
        servers: [
            "https://www.roblox.com/share?code=TON_CODE_1",
            "https://www.roblox.com/share?code=TON_CODE_2"
        ],
        currentIndex: 0
    },
    petssim99: {
        name: "Pets Simulator 99",
        placeId: 8737899170,
        servers: [
            "https://www.roblox.com/share?code=TON_CODE_3"
        ],
        currentIndex: 0
    }
};


// 🔄 Rotation automatique toutes les 60 secondes
setInterval(() => {
    for (let game in games) {
        let g = games[game];
        g.currentIndex = (g.currentIndex + 1) % g.servers.length;
    }
    console.log("🔄 Rotation des serveurs effectuée");
}, 60000);


// 👥 Récupérer nombre de joueurs (serveurs publics)
async function getPlayerCount(placeId) {
    try {
        const res = await fetch(`https://games.roblox.com/v1/games/${placeId}/servers/Public?limit=10`);
        const data = await res.json();

        let totalPlayers = 0;

        data.data.forEach(server => {
            totalPlayers += server.playing;
        });

        return totalPlayers;
    } catch (err) {
        console.log(err);
        return "Inconnu";
    }
}


// 🎮 Commande
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

        await message.reply({
            content: "🎮 Choisis un jeu :",
            components: [row]
        });
    }
});


// 📌 Interaction menu
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "select_game") {
        const gameKey = interaction.values[0];
        const game = games[gameKey];

        const playerCount = await getPlayerCount(game.placeId);

        const currentServer = game.servers[game.currentIndex];

        let msg = `🎮 **${game.name}**\n\n`;
        msg += `👥 Joueurs (public) : ${playerCount}\n\n`;
        msg += `🔒 Serveur privé actuel :\n👉 ${currentServer}\n\n`;
        msg += `🔄 Rotation auto active`;

        await interaction.reply(msg);
    }
});


client.login(process.env.TOKEN);
