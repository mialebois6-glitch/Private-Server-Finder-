const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ]
});

const commands = [
    new SlashCommandBuilder()
        .setName("msg")
        .setDescription("Envoyer un message")
        .addStringOption(option =>
            option
                .setName("texte")
                .setDescription("Le message à envoyer")
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {

        console.log("Création des commandes...");

        // Commande globale
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Commandes créées.");

    } catch (error) {
        console.error(error);
    }
})();

client.once("ready", () => {
    console.log(`${client.user.tag} connecté`);
});

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "msg") {

        const texte = interaction.options.getString("texte");

        // Réponse invisible
        await interaction.reply({
            content: "Message envoyé",
            ephemeral: true
        });

        // Envoie dans le salon ou en MP
        await interaction.channel.send(texte);
    }
});

client.login(process.env.TOKEN);
