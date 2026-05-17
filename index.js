require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const CONFIG_FILE = "./users.json";

let users = {};

if (fs.existsSync(CONFIG_FILE)) {
    users = JSON.parse(fs.readFileSync(CONFIG_FILE));
}

// emojis
const fruitEmojis = {
    Dragon: "🐉",
    Kitsune: "🦊",
    Leopard: "🐆",
    Dough: "🍩",
    Spirit: "👹",
    Venom: "☠️",
    Buddha: "🟡",
    Portal: "🌀",
    Rumble: "⚡",
    Flame: "🔥"
};

// save config
function saveUsers() {
    fs.writeFileSync(
        CONFIG_FILE,
        JSON.stringify(users, null, 2)
    );
}

// slash command
const commands = [
    new SlashCommandBuilder()
        .setName("apply")
        .setDescription("Configure ton stock bot")
        .toJSON()
];

const rest = new REST({ version: "10" })
    .setToken(TOKEN);

(async () => {

    try {

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log("Slash command chargé");

    } catch (err) {

        console.log(err);
    }
})();

// récupération stock
async function getStock() {

    try {

        const response = await axios.get(
            "https://fruityblox.com/stock",
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                }
            }
        );

        const $ = cheerio.load(response.data);

        let fruits = [];

        $(".stock-item").each((i, el) => {

            const fruit = $(el)
                .find(".fruit-name")
                .text()
                .trim();

            if (fruit) fruits.push(fruit);
        });

        return fruits;

    } catch {

        return [];
    }
}

// slash command interaction
client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "apply") {

        users[interaction.user.id] = {
            fruits: [],
            pingStock: true
        };

        saveUsers();

        await interaction.reply({
            content: "📩 Regarde tes MP.",
            ephemeral: true
        });

        const dm = await interaction.user.createDM();

        await dm.send(
`🍎 CONFIGURATION BLOX FRUIT

Envoie les fruits que tu veux surveiller.

Exemple :
Dragon,Kitsune,Leopard

Tape :
all
pour tous les fruits.`
        );

        const filter = m => m.author.id === interaction.user.id;

        const collector = dm.createMessageCollector({
            filter,
            time: 60000,
            max: 1
        });

        collector.on("collect", async msg => {

            let fruits = [];

            if (
                msg.content.toLowerCase() === "all"
            ) {

                fruits = ["all"];

            } else {

                fruits = msg.content
                    .split(",")
                    .map(f => f.trim());
            }

            users[interaction.user.id].fruits =
                fruits;

            await dm.send(
`🔔 Veux-tu être ping quand il y a du stock ?

Répond :
oui
ou
non`
            );

            saveUsers();

            const collector2 =
                dm.createMessageCollector({
                    filter,
                    time: 60000,
                    max: 1
                });

            collector2.on(
                "collect",
                async msg2 => {

                    users[
                        interaction.user.id
                    ].pingStock =
                        msg2.content.toLowerCase() ===
                        "oui";

                    saveUsers();

                    await dm.send(
                        "✅ Configuration terminée."
                    );
                }
            );
        });
    }
});

// update stock
async function updateStock() {

    const fruits = await getStock();

    if (!fruits.length) return;

    for (const userId in users) {

        const config = users[userId];

        const user =
            await client.users.fetch(userId);

        let detected = [];

        if (
            config.fruits.includes("all")
        ) {

            detected = fruits;

        } else {

            detected = fruits.filter(f =>
                config.fruits.includes(f)
            );
        }

        if (!detected.length) continue;

        const stockText = detected
            .map(f => {

                const emoji =
                    fruitEmojis[f] || "🍎";

                return `${emoji} ${f}`;
            })
            .join("\n");

        const embed = new EmbedBuilder()
            .setColor("#2b2d31")
            .setTitle(
                "🍎 FruityBlox Stock Alert"
            )
            .setDescription(stockText)
            .setFooter({
                text: "Live stock"
            })
            .setTimestamp();

        let content = "";

        if (config.pingStock) {
            content =
                "🚨 Fruit disponible !";
        }

        await user.send({
            content,
            embeds: [embed]
        });
    }
}

client.once("ready", async () => {

    console.log(
        `${client.user.tag} connecté`
    );

    updateStock();

    setInterval(updateStock, 300000);
});

client.login(TOKEN);
