const Discord = require('discord.js');
const child = require('child_process');
const fs = require('fs');

const client = new Discord.Client();

const dataJSON = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf-8'));

client.on('ready', () => {
	console.log('ready!');
});

client.on('message', msg => {
	let mentionRegEx = new RegExp('<@!?' + client.user.id + '>');
	if(!msg.author.bot && mentionRegEx.test(msg.content)) {
		let path = __dirname + '/tmp/' + msg.author.id + msg.createdTimestamp;
		let writeCmd = msg.content.replace(mentionRegEx, '').trim().trim();
		if(!/^#!/.test(writeCmd)) {
			writeCmd = '#!/bin/bash\n' + writeCmd;
		}
		fs.writeFileSync(path, writeCmd);
		fs.chmodSync(path, 0o777);
		child.exec(path, (err, stdout, stderr) => {
			if(err != null) {
				msg.channel.send('**Error**\n```' + stderr +'```');
			} else {
				msg.channel.send(stdout);
			}

			fs.unlinkSync(path);
		});
	}
});

client.login(dataJSON.discordToken);
