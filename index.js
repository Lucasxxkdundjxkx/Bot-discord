require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  AudioPlayerStatus
} = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.split(' ');
  const cmd = args[0].toLowerCase();

  // 🎵 PLAY
  if (cmd === '!play') {
    const url = args[1];

    if (!url) {
      return message.reply('❌ Pasá un link de YouTube');
    }

    try {
      // 🔥 obtener miembro actualizado
      const member = await message.guild.members.fetch(message.author.id);
      const vc = member.voice.channel;

      if (!vc) {
        return message.reply('❌ Tenés que estar en un canal de voz');
      }

      // 🔥 limpiar conexión vieja
      const oldConnection = getVoiceConnection(message.guild.id);
      if (oldConnection) oldConnection.destroy();

      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      const stream = await play.stream(url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      const player = createAudioPlayer();

      player.play(resource);
      connection.subscribe(player);

      message.reply('🎶 Reproduciendo...');

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      player.on('error', (err) => {
        console.error(err);
        connection.destroy();
      });

    } catch (err) {
      console.error(err);
      message.reply('❌ Error al reproducir');
    }
  }

  // ⛔ LEAVE
  if (cmd === '!leave') {
    const connection = getVoiceConnection(message.guild.id);

    if (connection) {
      connection.destroy();
      message.reply('👋 Me fui del canal');
    } else {
      message.reply('❌ No estoy en ningún canal');
    }
  }
});

client.login(process.env.TOKEN);