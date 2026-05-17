const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder
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

    // /msg
    new SlashCommandBuilder()
        .setName("msg")
        .setDescription("Envoyer un message")
        .addStringOption(option =>
            option
                .setName("texte")
                .setDescription("Le message")
                .setRequired(true)
        ),

    // /nit
    new SlashCommandBuilder()
        .setName("nit")
        .setDescription("Envoyer un Nitro fake en MP")
        .addUserOption(option =>
            option
                .setName("utilisateur")
                .setDescription("La personne")
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

    /*
    |--------------------------------------------------------------------------
    | COMMANDES SLASH
    |--------------------------------------------------------------------------
    */

    if (interaction.isChatInputCommand()) {

        /*
        |--------------------------------------------------------------------------
        | /msg
        |--------------------------------------------------------------------------
        */

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

                // Serveur
                await interaction.reply({
                    content: "✅",
                    ephemeral: true
                });

                await interaction.channel.send(texte);

            } catch (err) {

                console.error(err);

            }

        }

        /*
        |--------------------------------------------------------------------------
        | /nit
        |--------------------------------------------------------------------------
        */

        if (interaction.commandName === "nit") {

            const user = interaction.options.getUser("utilisateur");

            try {

                const embed = new EmbedBuilder()
                    .setTitle("🎁 Cadeau Mystère")
                    .setDescription(
                        `${user} Clique pour ouvrir le cadeau`
                    )
                    .setColor("#ff73fa")
                    .setImage("attachment://nitro.png");

                const file = new AttachmentBuilder("./nitro.png");

                await user.send({
                    embeds: [embed],
                    files: [file]
                });

                await interaction.reply({
                    content: `✅ MP envoyé à ${user.tag}`,
                    ephemeral: true
                });

            } catch (err) {

                console.error(err);

                await interaction.reply({
                    content: "❌ Impossible d'envoyer le MP",
                    ephemeral: true
                });

            }

        }

    }

});

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

client.login(process.env.TOKEN);
