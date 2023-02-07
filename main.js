const {Client, GatewayIntentBits} = require('discord.js');
const child = require('child_process');
const fs = require('fs');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]});

const dataJSON = JSON.parse(fs.readFileSync(__dirname + '/data.json', 'utf-8'));

client.on('ready', () => {
	console.log('ready!');
});

client.on('messageCreate', msg => {
	let mentionRegEx = new RegExp('<@!?' + client.user.id + '>');
	console.log(msg.author.tag + ': ' + msg.content);

	//bot以外からのメンションなら
	if(!msg.author.bot && mentionRegEx.test(msg.content)) {
		//一時スクリプトを置くパスをユーザーIDと時刻から決定
		let path = __dirname + '/tmp/' + msg.author.id + msg.createdTimestamp;

		//メンションを消して空行と前後の空白を取るため二度trim()
		let writeCmd = msg.content.replace(mentionRegEx, '').trim().trim();

		//Shebangがなければbashに
		if(!/^#!/.test(writeCmd)) {
			writeCmd = '#!/bin/bash\n' + writeCmd;
		}

		//一時ディレクトリ・スクリプトの作成
		fs.mkdirSync(path);
		fs.mkdirSync(path + '/images');
		fs.writeFileSync(path + '/run_tmp', writeCmd, {mode: 0o777});

		//30secの制限でスクリプトを実行
		child.exec(
			path + '/run_tmp',
			{
				timeout: 30000,
				cwd: path,
				env: Object.assign(process.env, {
					TEXTIMG_OUTPUT_DIR: path + '/images',
					TEXTIMG_FONT_FILE: '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
					TEXTIMG_EMOJI_DIR: '/usr/local/src/noto-emoji/png/128',
					TEXTIMG_EMOJI_FONT_FILE: '/usr/share/fonts/truetype/ancient-scripts/Symbola_hint.ttf'
				})
			},
			(err, stdout, stderr) => {
				if(err != null) {
					msg.channel.send('**Error**\n```' + stderr.slice(0, 1984) +'```');
				} else {
					let images = fs.readdirSync(path + '/images', {withFileTypes: true});
					let files = [];

					//imagesにファイルが有れば添付
					images.forEach(image => {
						if(image.isFile()) {
							files.push(path + '/images/' + image.name);
						}
					});

					msg.channel.send(stdout.slice(0, 2000), {files: files});
				}

				//一時ディレクトリ削除
				fs.rm(path, {recursive: true}, err => {
					if(err != null) throw err;
				});
			}
		);
	}
});

client.login(dataJSON.discordToken);
