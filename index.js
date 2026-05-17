const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const commands = [
    new SlashCommandBuilder()
        .setName('msg')
        .setDescription('Envoyer un message')
        .addStringOption(option =>
            option
                .setName('texte')
                .setDescription('Le message à envoyer')
                .setRequired(true)
        )
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Commande en cours de création...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Commande créée.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'msg') {

        const texte = interaction.options.getString('texte');

        // Réponse invisible
        await interaction.reply({
            content: 'Message envoyé',
            ephemeral: true
        });

        // Envoie le message
        await interaction.channel.send(texte);
    }
});

client.login(process.env.TOKEN);
