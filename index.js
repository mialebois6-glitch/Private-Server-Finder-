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

/*
|--------------------------------------------------------------------------
| Slash Commands
|--------------------------------------------------------------------------
*/

const commands = [
    new SlashCommandBuilder()
        .setName("msg")
        .setDescription("Envoyer un message invisible")
        .addStringOption(option =>
            option
                .setName("texte")
                .setDescription("Le message à envoyer")
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/*
|--------------------------------------------------------------------------
| Register Commands
|--------------------------------------------------------------------------
*/

(async () => {

    try {

        console.log("Création des slash commands...");

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Slash commands créées.");

    } catch (err) {
        console.error(err);
    }

})();

/*
|--------------------------------------------------------------------------
| Ready
|--------------------------------------------------------------------------
*/

client.once("ready", () => {

    console.log(`${client.user.tag} connecté`);

});

/*
|--------------------------------------------------------------------------
| Interaction
|--------------------------------------------------------------------------
*/

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "msg") {

        const texte = interaction.options.getString("texte");

        try {

            // Réponse invisible
            await interaction.reply({
                content: "✅ Message envoyé",
                ephemeral: true
            });

            // Message visible
            await interaction.followUp({
                content: texte
            });

        } catch (err) {

            console.error(err);

        }
    }
});

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

client.login(process.env.TOKEN);
