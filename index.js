var fs = require('fs');
const Discord = require('discord.js');
var config = require('./config.json');
const bot = new Discord.Client({ autoReconnect: true });

var currentVoiceConnection;
var voiceChs = [];
var commands = new Map();
var prefix = config.cmd_prefix + ' ';

commands.set(new RegExp(prefix + "init", 'i'), ['init', true, initVoiceChannels]);
commands.set(new RegExp(prefix + "info", 'i'), ['info', false, displayInfo]);
commands.set(new RegExp(prefix + "commands", 'i'), ['commands', false, displayCommands]);
commands.set(new RegExp(prefix + "join", 'i'), ['join', true, joinVoiceChannel]);
commands.set(new RegExp(prefix + "play", 'i'), ['play', false, playClip]);
commands.set(new RegExp(prefix + "clips", 'i'), ['clips', false, listClips]);
commands.set(new RegExp(prefix + "leave", 'i'), ['leave', true, leaveVoiceChannel]);

function initVoiceChannels(channel, guild) {
	channel.send("Initializing...");

	voiceChs = guild.channels.filter(channel => {
		return channel.type == "voice";
	}).array();

	channel.send("Found a total of (" + voiceChs.length + ") voice channels.");
	channel.send("Type join <channel name> to join a voice channel.");
}

function displayInfo(message) {
	message.reply('Daily raids starting at 9PM EST');
	message.reply('You must have completed G19. Be in the assembly area behind the pub in Emain.');
}

function displayCommands(message) {
	message.reply('\nUsage: !girg <command> \nwhere <command> is one of: \n  info, commands, play')
}

function joinVoiceChannel(channelName, channel) {
	channel.send("Attempting to join channel: " + channelName);

	var channels = voiceChs.filter((channel) => {
		return channel.name == channelName;
	});

	if(!channels.length) {
		channel.send("Channel not found.");
		return;
	}

	channels[0].join().then(conn => {
		currentVoiceConnection = conn;
		channel.send("Joined channel: " + conn.channel.name);
	});
}

function leaveVoiceChannel(channel) {
	if(channel) channel.disconnect();
}

function listClips(message) {
	var files = fs.readdirSync(config.sound_path);
	var filenames = "\n";

	files.forEach(filename => {
		filenames = filenames.concat(filename + '\n');
	});
	// console.log(filenames);
	message.reply(filenames);
}

function playClip(channel, filename, vol = config.volume) {
	if(!filename) {
		channel.send("Usage: !girg play <filename>");
	}

	var player = currentVoiceConnection.playFile(config.sound_path + filename, { volume: vol });

	player.once('error', err => {
		channel.send(err.message);
	});
}


bot.on('ready', () => {
	// console.log(bot.user);
	bot.user.setGame("!girg info");
});

bot.on('message', msg => {
	if(/Thug/i.test(msg.content)) {
		msg.channel.send("nibsta?").then(sentmsg => {
			sentmsg.delete(2000);
		});
	}

	if(msg.content.indexOf("zzz") > -1 && msg.author.username != bot.user.username) {
		msg.reply("zzz");
	}

	if(msg.content == prefix + "exit") {
		bot.destroy();
		process.exit(0);
	}

	if(msg.author.username !== bot.user.username) {
		commands.forEach((handler, regex) => {
			// command "regex => ['type', 'discriminator?', function]"
			if(msg.content.match(regex)) {
				if(!handler[1] || msg.author.discriminator == config.discriminator) {
					switch(handler[0]) {
						case 'init':
							handler[2](msg.channel, msg.guild);
							break;
						case 'info':
							handler[2](msg);
							break;
						case 'commands':
							handler[2](msg);
							break;
						case 'join':
							handler[2](parseArgs(msg.content), msg.channel);
							break;
						case 'play':
							handler[2](msg.channel, parseArgs(msg.content));
							break;
						case 'clips':
							handler[2](msg);
							break;
						case 'leave':
							handler[2](currentVoiceConnection);
							break;
						default:
							break;
					}
				}
			}
		});
	}
});

// returns array of additional arguments (space separated)
function parseArgs(msg) {
	if(!msg.length) return [];

	var args = msg.split(' ');
	args.shift();
	args.shift();

	return args[0];
}

(function init() {
	bot.login(config.bot_token).then((token) => {
		console.log(token);
	});
})();