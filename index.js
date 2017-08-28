var fs = require('fs');
const Discord = require('discord.js');
var config = require('./config.json');
const bot = new Discord.Client({ autoReconnect: true });

var currentVoiceConnection;
var voiceChs = [];
var commands = new Map();
var prefix = config.cmd_prefix + ' ';

// rebase commit 1

commands.set(new RegExp(prefix + "init", 'i'), ['init', true, initVoiceChannels]);
commands.set(new RegExp(prefix + "info", 'i'), ['info', false, displayInfo]);
commands.set(new RegExp(prefix + "shield", 'i'), ['shield', false, shieldInfo]);
commands.set(new RegExp(prefix + "spike", 'i'), ['spike', false, spikeInfo]);
commands.set(new RegExp(prefix + "blade", 'i'), ['blade', false, bladeInfo]);
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

function shieldInfo(message, adv) {
	var info = "\nSub-skill priorities: Giving Heart for longer shield range -> Guarded Footsteps for increased movement speed-> Recovering Touch for wound healing. \n\n";
	info = info + "Stay separated from other shields. Stay still unless forced to move. When should you move? \n"
	info = info + "1) girg is trying to whack you with his staff -> juke. 2) girg moved out of your field of view -> catch up. \n\n Shielder is usually on RI/SS or party heal duty. See !girg riss or !girg ph for more details.";

	if(adv) {
		info = "What separates a good shielder from a great shielder is positioning. \n\n";
		info = info + "During fanatacism (grab) phase, people will congregate around girg. Put hits on girg if you can, but try not to move too close to the crowd (range upgraded dowra helps). Stand far enough away from girg so you don't get knocked away and stunned when he jumps. \n\n";
		info = info + "In the unfortunately event that you get thrown far away from the group, you have two choices: 1) If you die, announce it in raid chat. 2)If you survive, or get insta-revived by balloon, get on a fast pet and try to make it back ASAP. If you get displacement glitched (it happens most of the time), trans/demi/crisis escape, or tring to attack girg with guns will 'teleport' you to your actual location\n\n";
		info = info + "During soul phase, stay a good distance away from girg while maintaining field of view. This does not apply if you're shielding a lance charger, in which case it's better to move closer so you can catch him after a lance charge, allowing him to blade instead of having to shield for himself.\n\n";
		info = info + "During poison phase, stay put if you get poisoned. This allows your team members to make decisions for themselves, whether to avoid the poison, or to come into the poison if girg does the jump attack. If all three of you move independently, it's harder to group up. Remember, getting your team poisoned is not the end of the world - avoiding them, and as a result failing to shield them, is the worse outcome.";
	}

	message.reply(info);
}

function spikeInfo(message) {
	var info = "\nSub-skill priorities: Spreading Faith for longer cast distance, then put points in everything else. Additional cast range is gained for every 5 levels into binding. \n\n";
	info = info + "Spiker is the easiest role. All you have to do is just follow your shielder and not die. Note that spikers are usually on RI/SS duty. See !girg riss for more details.";

	message.reply(info);
}

function bladeInfo(message) {
	var info = "If you are last or second last blade, and you see dead spikers after a Mineral Hail attack, you should spike instead of blade to ensure at least 2 spikes land. In general, 2 spikes are needed to stun and 3 for 100% boost to blade damage. It's important to ensure the top blades get to attack in this situation. \n\n";

	info = info + "It's a good habit to glance over the blade list after Mineral Hail to see if any blader died. Disciplined bladers will announce it if they die, but you can't always rely on that. If anyone above your blade order dies, skip their blade. A lot of the time an entire blade round fails to connect because someone is waiting for a skipped blade to drop, running out girg's stun timer.";

	message.reply(info);
}

function RISS(message) {
	var info = "Stands for Rage Impact + Support Shot. Each skill increases the damage done by the next melee attack (that does a certain % of damage), and, if stacked correctly, the combination will have an increased effect. \n\n";
	info = info + "In order to 'stack' RI + SS properly, support shot has to land on the same target IMMEDIATELY after rage impact hits. There is approximately a window of 0.5 seconds between when RI hits and when SS hits. If this window is not met, the effect will not stack, and the most recent skill will overwrite. \n\n";
	info = info + "1)If this window is not met, i.e. SS landed too late after RI, only the bonus from SS will be applied. \n 2)If SS landed before RI, RI will overwrite effect of SS.\n\n"
	info = info + "you're first RI, it's a good idea to coordinate with the support shot when you're ";

	message.reply(info);
}

function partyHeal(message) {

}

// dev commit 1

function displayInfo(message) {
	message.reply('Daily raids starting at 9PM EST');
	message.reply('You must have completed G19. Be in the assembly area behind the pub in Emain.');
}

function displayCommands(message) {
	message.reply('\nUsage: !girg <command> \nwhere <command> is one of: \n  info, commands, play, shield, shield adv')
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
						case 'shield':
							handler[2](msg, parseArgs(msg.content));
							break;
						case 'spike':
							handler[2](msg);
							break;
						case 'blade':
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