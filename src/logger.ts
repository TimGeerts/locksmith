import { Client } from '@typeit/discord';
import DiscordJS = require('discord.js');

export namespace Logger {
  _logChan: DiscordJS.TextChannel;
  export function init(client: Client) {
    const channel = client.channels.cache.find((c) => c.id === process.env.BOT_CHAN && c.type === 'text');
    if (channel) {
      this._logChan = channel as DiscordJS.TextChannel;
    }
  }

  export function log(message: string, prefix?: string) {
    if (prefix) {
      prefix = `[${prefix}] - `;
    } else {
      prefix = '';
    }
    this._logChan.send(`${prefix}${message}`);
  }
}
