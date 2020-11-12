import { CommandMessage, Client } from '@typeit/discord';
import { Guild, Message, MessageReaction, ReactionCollector, Role, Snowflake, TextChannel, User } from 'discord.js';
import { Emoji } from './types';

export namespace Utils {
  _client: Client;
  _logChan: TextChannel;

  export const guildColor: string = '#a330c9';

  //* Init (pass client property) *//
  export function init(client: Client): void {
    this._client = client;
    const channel = client.channels.cache.find((c) => c.id === process.env.BOT_CHAN && c.type === 'text');
    if (channel) {
      this._logChan = channel as TextChannel;
    }
  }

  //* General helpers *//
  export function hasParams(command: CommandMessage) {
    return command?.args?.param;
  }

  //* Log helpers *//
  // basic log function
  export function log(message: string, prefix?: string) {
    if (prefix) {
      prefix = `[${prefix}] - `;
    } else {
      prefix = '';
    }
    if (this._logChan) {
      this._logChan.send(`${prefix}${message}`);
    } else {
      console.log(`${prefix}${message}`);
    }
  }

  export function success(message: string): void {
    this.log(`:white_check_mark: ${message}`);
  }

  // wrapper that adds the [DEBUG] prefix
  export function debug(message: string): void {
    if (process.env.DEBUG === 'true') {
      this.log(message, 'DEBUG');
    }
  }

  // wrapper that adds the [ERROR] prefix
  export function error(message: string): void {
    this.log(message, 'ERROR');
  }

  //* Emoji/Role helpers *//
  // gets the emoji for the given role (for usage in text)
  export function getEmoji(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = this._client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? `<:${customEmoji.name}:${customEmoji.id}>` : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  // gets the emoji for the given role (for usage in reactions)
  export function getEmojiForReaction(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = this._client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? customEmoji.id : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  // finds the role (name) for the given "reaction"
  export function findRoleNameForReaction(reaction: MessageReaction): string {
    let role: string = undefined;
    // if it has an id, it's a custom emoji
    const emojiToCheck: string = reaction.emoji.id ?? reaction.emoji.name;
    switch (emojiToCheck) {
      case Emoji.Tank:
      case Emoji.TankFallBack:
        role = 'Tank';
        break;
      case Emoji.Healer:
      case Emoji.HealerFallBack:
        role = 'Healer';
        break;
      case Emoji.Dps:
      case Emoji.DpsFallBack:
        role = 'Dps';
        break;
    }
    return role;
  }

  // finds the role (of type Role) for the given "reaction"
  export function findRoleForReaction(reaction: MessageReaction): Role {
    const roleName = this.findRoleNameForReaction(reaction);

    const discordRole = reaction?.message?.guild?.roles.cache.find(
      (r) => r.name.toLocaleLowerCase() === roleName.toLocaleLowerCase()
    );
    if (!discordRole) {
      error(`The role '${roleName}' could not be found in this discord.`);
    }
    return discordRole;
  }

  // adds a role to a given user
  export function addRole(guild: Guild, user: User, role: Role): void {
    // fuck you caching!
    this.debug(`trying to assign role ${role.name} to user ${user.username}`);
    guild.members
      .fetch(user)
      .then((m) => {
        this.debug(`user ${user.username} found, adding role ${role.name}`);
        m.roles
          .add(role)
          .then((r) => {
            this.debug(`role ${role.name} added to ${user.username}`);
          })
          .catch((e) => {
            this.error(`${e}`);
          });
      })
      .catch((e) => {
        this.error(`${e}`);
      });
  }

  // removes a role from a given user
  export function removeRole(guild: Guild, user: User, role: Role): void {
    // fuck you caching!
    this.debug(`trying to remove role ${role.name} from user ${user.username}`);
    guild.members
      .fetch(user)
      .then((m) => {
        this.debug(`user ${user.username} found, removing role ${role.name}`);
        m.roles
          .remove(role)
          .then((r) => {
            this.debug(`role ${role.name} removed from ${user.username}`);
          })
          .catch((e) => {
            this.error(`${e}`);
          });
      })
      .catch((e) => {
        this.error(`${e}`);
      });
  }

  // generic filter that can be used in a reactionCollector used for roles
  export function createRoleReactionCollector(message: Message): ReactionCollector {
    const tank = this.getEmojiForReaction('Tank');
    const healer = this.getEmojiForReaction('Healer');
    const dps = this.getEmojiForReaction('Dps');
    const lock = '🔒';

    return message.createReactionCollector(
      (reaction: MessageReaction, user: User) => {
        const toCheck = reaction.emoji.id ?? reaction.emoji.name;
        return !user.bot && [tank, healer, dps, lock].includes(toCheck);
      },
      {
        dispose: true,
      }
    );
  }

  //* Ping helpers *//
  // used to create a string of mentions based on an array of rolenames
  export function getPingStringForRoles(roles: string[], guild: Guild): string {
    const idsToMention: Snowflake[] = [];
    roles.forEach((missingRole) => {
      const guildRole = guild.roles.cache.find((r) => r.name.toLocaleLowerCase() === missingRole.toLocaleLowerCase());
      if (guildRole) {
        idsToMention.push(guildRole.id);
      }
    });
    return idsToMention.map((id) => `<@&${id}>`).join(' ');
  }
}
