import DiscordJS = require('discord.js');
import { Client } from '@typeit/discord';

export abstract class BaseModule {
  protected client: Client;
  protected logChan: DiscordJS.TextChannel;

  /** logs to a specific channel on the discord, the channelId can be set as an environment variable 'BOT_CHAN' */
  public log(message: string, prefix?: string): void {
    if (prefix) {
      prefix = `[${prefix}] - `;
    } else {
      prefix = '';
    }
    this.logChan.send(`${prefix}${message}`);
  }
}

export interface ILogModule {
  log(message: string): void;
}
