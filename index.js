require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder
} = require("discord.js");

const axios = require("axios");
const cheerio = require("cheerio");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;

let messageId = null;
let oldStock = "";

const fruitEmojis = {
    Rocket: "🚀",
    Spin: "🌀",
    Chop: "🔪",
    Spring: "🌸",
    Bomb: "💣",
    Smoke: "💨",
    Spike: "📌",
    Flame: "🔥",
    Falcon: "🦅",
    Ice: "❄️",
    Sand: "🏜️",
    Dark: "🌑",
    Diamond: "💎",
    Light: "💡",
    Rubber: "🧤",
    Barrier: "🛡️",
    Ghost: "👻",
    Magma: "🌋",
    Quake: "🌎",
    Buddha: "🟡",
    Love: "💖",
    Spider: "🕷️",
    Sound: "🎵",
    Phoenix: "🦜",
    Portal: "🌀",
    Rumble: "⚡",
    Pain: "😖",
    Blizzard: "🌨️",
    Gravity: "🌌",
    Mammoth: "🦣",
    T-Rex: "🦖",
    Dough: "🍩",
    Shadow: "🌑",
    Venom: "☠️",
    Control: "🎮",
    Spirit: "👹",
    Leopard: "🐆",
    Dragon: "🐉",
    Kitsune: "🦊"
};

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

            const fruit = $(el).find(".fruit-name").text().trim();

            if (fruit) {
                fruits.push(fruit);
            }
        });

        return fruits;

    } catch (err) {

        console.log("Erreur FruityBlox :", err.message);
        return [];
    }
}

function formatStock(fruits) {

    return fruits.map(fruit => {

        const emoji = fruitEmojis[fruit] || "🍎";

        return `${emoji} ${fruit}`;

    }).join("\n");
}

async function updateStock() {

    const fruits = await getStock();

    if (!fruits.length) return;

    const stockText = formatStock(fruits);

    if (stockText === oldStock) return;

    oldStock = stockText;

    const channel = await client.channels.fetch(CHANNEL_ID);

    const embed = new EmbedBuilder()
        .setColor("#2b2d31")
        .setTitle("🍎 FruityBlox • Live Stock")
        .setDescription(stockText)
        .setFooter({
            text: "Updates every 5 minutes"
        })
        .setTimestamp();

    // ping fruits rares
    let ping = "";

    if (
        fruits.includes("Dragon") ||
        fruits.includes("Kitsune")
    ) {
        ping = `<@&${ROLE_ID}> 🐉 Fruit rare en stock !`;
    }

    // update du même message
    if (messageId) {

        try {

            const msg = await channel.messages.fetch(messageId);

            await msg.edit({
                content: ping,
                embeds: [embed]
            });

        } catch {

            const newMsg = await channel.send({
                content: ping,
                embeds: [embed]
            });

            messageId = newMsg.id;
        }

    } else {

        const newMsg = await channel.send({
            content: ping,
            embeds: [embed]
        });

        messageId = newMsg.id;
    }

    console.log("Stock mis à jour !");
}

client.once("ready", async () => {

    console.log(`${client.user.tag} connecté !`);

    await updateStock();

    setInterval(updateStock, 300000);
});

client.login(TOKEN);
