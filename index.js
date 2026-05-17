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
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const CONFIG_FILE = "./users.json";

let users = {};

if (fs.existsSync(CONFIG_FILE)) {
    users = JSON.parse(
        fs.readFileSync(CONFIG_FILE)
    );
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
    Flame: "🔥",
    Shadow: "🌑",
    Mammoth: "🦣",
    T-Rex: "🦖",
    Control: "🎮",
    Gravity: "🌌",
    Blizzard: "🌨️"
};

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
        .setDescription(
            "Configure tes notifications"
        )
        .toJSON()
];

const rest = new REST({
    version: "10"
}).setToken(TOKEN);

(async () => {

    try {

        await rest.put(
            Routes.applicationCommands(
                CLIENT_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            "Commande /apply chargée"
        );

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

        const $ = cheerio.load(
            response.data
        );

        let fruits = [];

        $(".stock-item").each(
            (i, el) => {

                const fruit = $(el)
                    .find(".fruit-name")
                    .text()
                    .trim();

                if (fruit)
                    fruits.push(fruit);
            }
        );

        return fruits;

    } catch {

        return [];
    }
}

// commande
client.on(
    "interactionCreate",
    async interaction => {

        if (
            !interaction.isChatInputCommand()
        )
            return;

        if (
            interaction.commandName ===
            "apply"
        ) {

            const userId =
                interaction.user.id;

            const dm =
                await interaction.user.createDM();

            // déjà configuré
            if (users[userId]) {

                await interaction.reply({
                    content:
                        "📩 Regarde tes MP.",
                    ephemeral: true
                });

                await dm.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(
                                "#ff2f6d"
                            )
                            .setTitle(
                                "⚙️ Configuration déjà existante"
                            )
                            .setDescription(
`Tu as déjà une configuration.

Veux-tu la reconfigurer ?

✅ oui
❌ non`
                            )
                    ]
                });

                const filter = m =>
                    m.author.id ===
                    userId;

                const collector =
                    dm.createMessageCollector(
                        {
                            filter,
                            max: 1,
                            time: 60000
                        }
                    );

                collector.on(
                    "collect",
                    async msg => {

                        if (
                            msg.content.toLowerCase() !==
                            "oui"
                        ) {

                            return dm.send(
                                "❌ Configuration annulée."
                            );
                        }

                        setupUser(
                            interaction,
                            dm
                        );
                    }
                );

            } else {

                await interaction.reply({
                    content:
                        "📩 Regarde tes MP.",
                    ephemeral: true
                });

                setupUser(
                    interaction,
                    dm
                );
            }
        }
    }
);

// setup utilisateur
async function setupUser(
    interaction,
    dm
) {

    const userId =
        interaction.user.id;

    users[userId] = {
        fruits: [],
        pingStock: true
    };

    saveUsers();

    await dm.send({
        embeds: [
            new EmbedBuilder()
                .setColor("#ff2f6d")
                .setTitle(
                    "🍎 Configuration Blox Fruits"
                )
                .setDescription(
`Choisis les fruits à surveiller.

Exemple :
\`Dragon,Kitsune,Leopard\`

ou :

\`all\`

pour tous les fruits.`
                )
                .setThumbnail(
                    "https://tr.rbxcdn.com/180DAY-f909895fbb89d32f1c0a8ff881a688b9/420/420/Image/Png/noFilter"
                )
        ]
    });

    const filter = m =>
        m.author.id === userId;

    const collector =
        dm.createMessageCollector({
            filter,
            max: 1,
            time: 60000
        });

    collector.on(
        "collect",
        async msg => {

            let fruits = [];

            if (
                msg.content.toLowerCase() ===
                "all"
            ) {

                fruits = ["all"];

            } else {

                fruits =
                    msg.content
                        .split(",")
                        .map(f =>
                            f.trim()
                        );
            }

            users[userId].fruits =
                fruits;

            saveUsers();

            await dm.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(
                            "#5865F2"
                        )
                        .setTitle(
                            "🔔 Notifications"
                        )
                        .setDescription(
`Veux-tu être ping quand un fruit recherché est en stock ?

✅ oui
❌ non`
                        )
                ]
            });

            const collector2 =
                dm.createMessageCollector(
                    {
                        filter,
                        max: 1,
                        time: 60000
                    }
                );

            collector2.on(
                "collect",
                async msg2 => {

                    users[
                        userId
                    ].pingStock =
                        msg2.content.toLowerCase() ===
                        "oui";

                    saveUsers();

                    await dm.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    "#57F287"
                                )
                                .setTitle(
                                    "✅ Configuration terminée"
                                )
                                .setDescription(
`Tes notifications sont maintenant actives.`
                                )
                        ]
                    });
                }
            );
        }
    );
}

// update stock
async function updateStock() {

    const fruits =
        await getStock();

    if (!fruits.length) return;

    for (const userId in users) {

        try {

            const config =
                users[userId];

            const user =
                await client.users.fetch(
                    userId
                );

            let watched = [];

            if (
                config.fruits.includes(
                    "all"
                )
            ) {

                watched = fruits;

            } else {

                watched =
                    fruits.filter(f =>
                        config.fruits.includes(
                            f
                        )
                    );
            }

            const stockText =
                fruits
                    .map(f => {

                        const emoji =
                            fruitEmojis[
                                f
                            ] || "🍎";

                        return `${emoji} ${f}`;
                    })
                    .join("\n");

            const embed =
                new EmbedBuilder()
                    .setColor(
                        "#2b2d31"
                    )
                    .setTitle(
                        "🍎 Live Blox Fruits Stock"
                    )
                    .setDescription(
                        stockText
                    )
                    .setFooter({
                        text: "Updates every 5 minutes"
                    })
                    .setTimestamp();

            let content = "";

            // ping UNIQUEMENT si fruit recherché
            if (
                watched.length &&
                config.pingStock
            ) {

                content =
`🚨 Fruits recherchés trouvés !

${watched.map(f =>
`${fruitEmojis[f] || "🍎"} ${f}`
).join("\n")}`;
            }

            await user.send({
                content,
                embeds: [embed]
            });

        } catch (err) {

            console.log(
                "Erreur user :",
                err.message
            );
        }
    }
}

client.once(
    "ready",
    async () => {

        console.log(
            `${client.user.tag} connecté`
        );

        updateStock();

        setInterval(
            updateStock,
            300000
        );
    }
);

client.login(TOKEN);
