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
  if (!message.content.startsWith('!')) return;

  const args = message.content.split(' ');
  const cmd = args[0].toLowerCase();

  // 🎵 PLAY
  if (cmd === '!play') {
    const url = args[1];
    if (!url) return message.reply('❌ Pasá un link');

    const member = await message.guild.members.fetch(message.author.id);
    const vc = member.voice.channel;
    if (!vc) return message.reply('❌ Entrá a un canal de voz');

    try {
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
          connection.destroy();
          players.delete(message.guild.id);
        });
      }

      player.play(resource);
      connection.subscribe(player);

      message.reply('🎶 Reproduciendo');

    } catch (err) {
      console.log(err);
      message.reply('❌ Error al reproducir');
    }
  }

  // ⏸ PAUSE
  if (cmd === '!pause') {
    const player = players.get(message.guild.id);
    if (player) {
      player.pause();
      message.reply('⏸ Pausado');
    }
  }

  // ▶️ RESUME
  if (cmd === '!resume') {
    const player = players.get(message.guild.id);
    if (player) {
      player.unpause();
      message.reply('▶️ Continuando');
    }
  }

  // ⏹ STOP
  if (cmd === '!stop') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      players.delete(message.guild.id);
      message.reply('⏹ Detenido');
    } else {
      message.reply('❌ No hay música');
    }
  }
});

client.login(token);    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const token = process.env.TOKEN;

// Guardar reproductores por servidor
const players = new Map();

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

    if (!url) return message.reply('❌ Pasá un link de YouTube');

    const member = await message.guild.members.fetch(message.author.id);
    const vc = member.voice.channel;

    if (!vc) return message.reply('❌ Tenés que estar en un canal de voz');

    try {
      let connection = getVoiceConnection(message.guild.id);

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: vc.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator
        });
      }

      const stream = await play.stream(url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      let player = players.get(message.guild.id);

      if (!player) {
        player = createAudioPlayer();
        players.set(message.guild.id, player);

        player.on(AudioPlayerStatus.Idle, () => {
          connection.destroy();
          players.delete(message.guild.id);
        });
      }

      player.play(resource);
      connection.subscribe(player);

      message.reply('🎶 Reproduciendo...');

    } catch (err) {
      console.log(err);
      message.reply('❌ Error al reproducir');
    }
  }

  // ⏸ PAUSE
  if (cmd === '!pause') {
    const player = players.get(message.guild.id);
    if (player) {
      player.pause();
      message.reply('⏸ Pausado');
    }
  }

  // ▶️ RESUME
  if (cmd === '!resume') {
    const player = players.get(message.guild.id);
    if (player) {
      player.unpause();
      message.reply('▶️ Continuando');
    }
  }

  // ⏹ STOP
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

client.login(token);
