import { MessageEmbed, Message, MessageReaction, User, EmbedField } from 'discord.js';
import { Command, CommandMessage, Description, Client, On } from '@typeit/discord';
import { getDungeons } from '../services/resource.service';
import { Emoji, IDungeon } from '../types';

export abstract class Key {
  private client: Client;

  @Command('key :key :level :tank :heal :dps')
  @Description("Displays a template for people to 'sign up' for a given key")
  async key(command: CommandMessage, client: Client) {
    this.client = client;
    getDungeons()
      .then((dungeons: IDungeon[]) => {
        if (dungeons && dungeons.length) {
          const helpEmbed = new MessageEmbed();
          let keyEmbed = new MessageEmbed();
          if (!command.args.key && !command.args.level) {
            helpEmbed
              .setColor('#007bff')
              .setTitle('Usage')
              .setDescription('Some example usages of the `?key` command')
              .addField(
                'Syntax',
                '`?key <dungeon> <level> <tank> <healer> <dps>`\n*(tank/healer/dps are optional parameters)*'
              )
              .addField('Looking for a full group', '`?key AD 18`')
              .addField('Looking for two dps', '`?key AD 18 0 0 2`')
              .addField('Looking for tank and healer', '`?key AD 18 1 1 0`');
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField('Dungeon acronyms', dungeon_acronyms.join('\n'));

            command.reply(helpEmbed);
          } else {
            const key = command.args.key;
            const level = command.args.level;
            const tank = command.args.tank;
            const healer = command.args.heal;
            const dps = command.args.dps;
            const dungeon = dungeons.find((d) => d.tags.map((t) => t.toLowerCase()).indexOf(key?.toLowerCase()) > -1);
            if (!dungeon) {
              throw new Error(`No dungeon was found for the parameter  \`${key}\``);
            }
            if (!level || isNaN(level)) {
              throw new Error(`No keylevel could be determined from the parameter \`${level}\``);
            }
            command.args.key = dungeon.name;
            keyEmbed = this.createEmbed(command);

            const chan = command.channel;
            chan.send(keyEmbed).then((m: Message) => {
              if (tank === 1 || tank === undefined) {
                m.react(this.getEmojiForReaction('Tank'));
              }
              if (healer === 1 || healer === undefined) {
                m.react(this.getEmojiForReaction('Healer'));
              }
              if (dps !== 0 || dps === undefined) {
                m.react(this.getEmojiForReaction('Dps'));
              }
              this.followReactions(m, keyEmbed);
            });
          }
        } else {
          throw new Error('No dungeons were found');
        }
      })
      .catch((err: Error) => {
        command.reply(`Sorry, I had some trouble fetching that information.\n\n${err.message}`);
      });
  }

  private followReactions(msg: Message, embed: MessageEmbed): void {
    const filter = (reaction: MessageReaction, user: User) => {
      return true; //!user.bot && this.filterReaction(reaction);
    };
    const roleCollector = msg.createReactionCollector(filter, {
      dispose: true,
    });
    roleCollector.on('collect', (reaction, user) => {
      if (!user.bot) {
        const roleToAssign = this.findRole(reaction);
        if (roleToAssign) {
          this.updateEmbed(embed, user, roleToAssign);
          msg.edit(embed);
        }
      }
    });
    roleCollector.on('remove', (reaction, user) => {
      if (!user.bot) {
        const roleToRemove = this.findRole(reaction);
        if (roleToRemove) {
          this.updateEmbed(embed, user, roleToRemove, false);
          msg.edit(embed);
        }
      }
    });
  }

  private findRole(reaction: MessageReaction): string {
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

  private createEmbed(command: CommandMessage): MessageEmbed {
    const key = command.args.key;
    const level = command.args.level;
    const tank = command.args.tank;
    const heal = command.args.heal;
    let dps = command.args.dps;
    const embed = new MessageEmbed().setColor('e6cc80');
    embed.setTitle(`[LFG] ${key} +${level}`);
    if (tank === 1 || tank === undefined) {
      embed.addField(this.getEmoji('Tank'), '...');
    }
    if (heal === 1 || heal === undefined) {
      embed.addField(this.getEmoji('Healer'), '...');
    }
    dps = dps === undefined || dps > 3 ? 3 : dps;
    for (let i = 0; i < dps; i++) {
      embed.addField(this.getEmoji('Dps'), '...');
    }
    return embed;
  }

  private updateEmbed(embed: MessageEmbed, user: User, role: string, add = true): void {
    const userTag = `<@${user.id}>`;
    let field = null;
    switch (role.toLocaleLowerCase()) {
      case 'tank':
        field = embed.fields[0];
        if (field) {
          this.handleTankOrHeal(field, userTag, add);
        }
        break;
      case 'healer':
        field = embed.fields[1];
        if (field) {
          this.handleTankOrHeal(field, userTag, add);
        }
        break;
      default:
        let arr = embed.fields.filter((f) => f.name === Emoji.Dps);
        if (arr && arr.length) {
          this.handleDps(arr, userTag, add);
        }
        break;
    }
  }

  private handleTankOrHeal(field: EmbedField, userTag: string, add: boolean): void {
    if (add) {
      // check if there's a spot available
      field.value = field.value === '...' ? userTag : field.value;
    } else {
      // if we're removing a reaction, we can only remove the tag if that user was actually tagged
      field.value = field.value === userTag ? '...' : field.value;
    }
  }

  private handleDps(fields: EmbedField[], userTag: string, add: boolean) {
    if (add) {
      // find first empty field and assign the user to it
      let empField = fields.find((f) => f.value === '...');
      if (empField) {
        empField.value = userTag;
      }
    } else {
      // find first matching field and unassign the user
      let userField = fields.find((f) => f.value === userTag);
      if (userField) {
        userField.value = '...';
      }
    }
  }

  // Emoji helpers, all these are basically only needed to support custom emojis
  private getEmoji(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = this.client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? `<:${customEmoji.name}:${customEmoji.id}>` : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  private getEmojiForReaction(role: string): string {
    const e: string = Emoji[role];
    let retVal = e;
    // returns the emoji, either straight from the enum, or a lookup in cache in case of a custom one
    if (Number(e)) {
      let customEmoji = this.client.emojis.cache.find((emoji) => emoji.id === e);
      retVal = customEmoji ? customEmoji.id : Emoji[`${role}FallBack`];
    }
    return retVal;
  }

  private filterReaction(reaction: MessageReaction): boolean {
    const tank = this.getEmojiForReaction('Tank');
    const healer = this.getEmojiForReaction('Healer');
    const dps = this.getEmojiForReaction('Dps');
    const toCheck = reaction.emoji.id ?? reaction.emoji.name;
    return [tank, healer, dps].includes(toCheck);
  }
}
