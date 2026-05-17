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
| COMMANDES
|--------------------------------------------------------------------------
*/

const commands = [
    new SlashCommandBuilder()
        .setName("msg")
        .setDescription("Envoyer un message")
        .addStringOption(option =>
            option
                .setName("texte")
                .setDescription("Message")
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

(async () => {

    try {

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log("Slash commands créées");

    } catch (err) {

        console.error(err);

    }

})();

/*
|--------------------------------------------------------------------------
| READY
|--------------------------------------------------------------------------
*/

client.once("clientReady", () => {

    console.log(`${client.user.tag} connecté`);

});

/*
|--------------------------------------------------------------------------
| INTERACTIONS
|--------------------------------------------------------------------------
*/

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "msg") {

        const texte = interaction.options.getString("texte");

        try {

            // MP
            if (!interaction.guild) {

                await interaction.reply({
                    content: texte
                });

                return;
            }

            // SERVEUR
            await interaction.reply({
                content: "✅",
                ephemeral: true
            });

            await interaction.channel.send(texte);

        } catch (err) {

            console.error(err);

        }
    }
});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

client.login(process.env.TOKEN);
