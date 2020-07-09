import * as Path from 'path';
import DiscordJS = require('discord.js');
import { Client, Discord, CommandMessage, CommandNotFound, Command, Description } from '@typeit/discord';

@Discord('!', {
  import: [Path.join(__dirname, 'commands', '*.ts')],
})
abstract class SinBot {
  @Command('help')
  @Description('List all available commands')
  private help(command: CommandMessage) {
    const cmds = Client.getCommands();
    const embed = new DiscordJS.MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Welcome to SinBot')
      .setDescription('The following commands are available: ');
    cmds.forEach((c) => {
      embed.addField(`${c.prefix}${c.commandName}`, c.description);
    });
    command.reply(embed);
  }
  @CommandNotFound()
  private notFound(message: CommandMessage) {
    const command = message.content;
    message.reply(`I'm sorry, the command \`\`${command}\`\` was not recognized.`);
  }
}
