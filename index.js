const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
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

const token = process.env.TOKEN;

const players = new Map();

client.once('ready', () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith('!')) return;

  const args = message.content.trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  if (cmd === '!play') {
    const url = args[0];
    if (!url) return message.reply('❌ Pasá un link de YouTube');

    try {
      const member = await message.guild.members.fetch(message.author.id);
      const vc = member.voice.channel;

      if (!vc) return message.reply('❌ Tenés que estar en un canal de voz');

      let connection = getVoiceConnection(message.guild.id);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: vc.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 20000);
      }

      const stream = await play.stream(url);

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true
      });

      resource.volume.setVolume(0.5);

      let player = players.get(message.guild.id);

      if (!player) {
        player = createAudioPlayer();
        players.set(message.guild.id, player);

        player.on(AudioPlayerStatus.Idle, () => {
          const conn = getVoiceConnection(message.guild.id);
          if (conn) conn.destroy();
          players.delete(message.guild.id);
        });

        player.on('error', (err) => {
          console.log('Player error:', err);
        });
      }

      player.play(resource);
      connection.subscribe(player);

      message.reply('🎶 Reproduciendo');
    } catch (err) {
      console.log('Play error:', err);
      message.reply('❌ Error al reproducir');
    }
  }

  if (cmd === '!pause') {
    const player = players.get(message.guild.id);
    if (player) {
      player.pause();
      message.reply('⏸ Pausado');
    } else {
      message.reply('❌ No hay música');
    }
  }

  if (cmd === '!resume') {
    const player = players.get(message.guild.id);
    if (player) {
      player.unpause();
      message.reply('▶️ Continuando');
    } else {
      message.reply('❌ No hay música');
    }
  }

  if (cmd === '!stop') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      players.delete(message.guild.id);
      message.reply('⏹ Música detenida');
    } else {
      message.reply('❌ No hay música');
    }
  }
});

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

if (!token) {
  console.error('❌ TOKEN no definido');
  process.exit(1);
}

client.login(token);
