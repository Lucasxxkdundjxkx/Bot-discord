const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const { Shoukaku, Connectors } = require("shoukaku");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const nodes = [
    {
        name: "Lavalink",
        url: "lava-v3.ajieblogs.eu.org:80",
        auth: "https://dsc.gg/ajidevserver",
        secure: false
    }
];

const shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    nodes
);

const commands = [
    new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce música")
        .addStringOption(option =>
            option
                .setName("query")
                .setDescription("Nombre o URL")
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta la canción"),

    new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Detiene la música")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
    try {
        console.log("Registrando slash commands...");

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log("Slash commands registrados");
    } catch (err) {
        console.error(err);
    }
})();

client.once("ready", () => {
    console.log(`${client.user.tag} conectado`);
});

const players = new Map();

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) return;

    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({
            content: "Tenés que entrar a un canal de voz",
            ephemeral: true
        });
    }

    if (interaction.commandName === "play") {

        await interaction.deferReply();

        try {

            const query = interaction.options.getString("query");

            let player = players.get(interaction.guild.id);

            if (!player) {

                const node = shoukaku.getIdealNode();

                player = await node.joinChannel({
                    guildId: interaction.guild.id,
                    channelId: voiceChannel.id,
                    shardId: 0,
                    deaf: true
                });

                players.set(interaction.guild.id, player);
            }

            const result = await player.node.rest.resolve(query);

            if (!result || !result.data.length) {
                return interaction.editReply("No encontré resultados");
            }

            const track = result.data[0];

            await player.playTrack({
                track: track.encoded
            });

            interaction.editReply(
                `▶️ Reproduciendo: **${track.info.title}**`
            );

        } catch (err) {
            console.error(err);
            interaction.editReply("Error reproduciendo la canción");
        }
    }

    if (interaction.commandName === "skip") {

        const player = players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply("No hay música reproduciéndose");
        }

        await player.stopTrack();

        interaction.reply("⏭️ Canción salteada");
    }

    if (interaction.commandName === "stop") {

        const player = players.get(interaction.guild.id);

        if (!player) {
            return interaction.reply("No hay música");
        }

        player.connection.disconnect();

        players.delete(interaction.guild.id);

        interaction.reply("⏹️ Música detenida");
    }
});

client.login(TOKEN);
