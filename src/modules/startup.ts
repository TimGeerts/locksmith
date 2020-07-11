import DiscordJS = require('discord.js');
import { Client, Command, Once, ArgsOf, CommandMessage, Infos, Description } from '@typeit/discord';
import { BaseModule } from './base';

export abstract class Startup extends BaseModule {
  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    // set client on basemodule
    this.client = client;
    // set bot logging channel on basemodule
    const channel = this.client.channels.cache.find((c) => c.id === process.env.BOT_CHAN && c.type === 'text');
    if (channel) {
      this.logChan = channel as DiscordJS.TextChannel;
    }
    this.log(':robot: bot started bleep bloop bleep bloop :robot:');
  }

  @Command('restart')
  @Infos({ description: 'Does it really need explaining?', forAdmins: true })
  private restart(command: CommandMessage, client: Client) {
    // TODO this should be set to only be allowed by specific roles, not everyone
    command.reply('Very well master, restarting, brb... :wave:').then(() => {
      process.exit();
    });
  }
}
