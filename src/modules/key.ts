import {
  MessageEmbed,
  Message,
  MessageReaction,
  User,
  EmbedField,
} from "discord.js";
import { Command, CommandMessage, Description, Client } from "@typeit/discord";
import { getDungeons, getRoles } from "../services/resource.service";
import { IDungeon, IRole } from "../types";

export abstract class Key {
  private allRoles: IRole[];
  // private lfgEmbed: MessageEmbed = new MessageEmbed();

  @Command("key :key :level :tank :heal :dps")
  @Description("Displays a template for people to 'sign up' for a given key")
  async key(command: CommandMessage, client: Client) {
    getDungeons()
      .then((dungeons: IDungeon[]) => {
        if (dungeons && dungeons.length) {
          const helpEmbed = new MessageEmbed();
          let keyEmbed = new MessageEmbed();
          if (!command.args.key && !command.args.level) {
            helpEmbed
              .setColor("#007bff")
              .setTitle("Usage")
              .setDescription("Some example usages of the `?key` command")
              .addField(
                "Syntax",
                "`?key <dungeon> <level> <tank> <healer> <dps>`\n*(tank/healer/dps are optional parameters)*"
              )
              .addField("Looking for a full group", "`?key AD 18`")
              .addField("Looking for two dps", "`?key AD 18 0 0 2`")
              .addField("Looking for tank and healer", "`?key AD 18 1 1 0`");
            const dungeon_acronyms = dungeons
              .sort((a, b) => (a.name > b.name ? 1 : -1))
              .map((d) => `${d.name}: \`${d.tags[0]}\``);
            helpEmbed.addField("Dungeon acronyms", dungeon_acronyms.join("\n"));

            command.reply(helpEmbed);
          } else {
            const key = command.args.key;
            const level = command.args.level;
            const tank = command.args.tank;
            const healer = command.args.heal;
            const dps = command.args.dps;
            const dungeon = dungeons.find(
              (d) =>
                d.tags.map((t) => t.toLowerCase()).indexOf(key?.toLowerCase()) >
                -1
            );
            if (!dungeon) {
              throw new Error(
                `No dungeon was found for the parameter  \`${key}\``
              );
            }
            if (!level || isNaN(level)) {
              throw new Error(
                `No keylevel could be determined from the parameter \`${level}\``
              );
            }
            command.args.key = dungeon.name;

            keyEmbed = this.createEmbed(command.args);
            getRoles().then((r: IRole[]) => {
              if (r && r.length) {
                this.allRoles = r;
                const chan = command.channel;
                // TODO enable when the command has been tested a bit in a real discord environment
                //chan.send("@here");
                chan.send(keyEmbed).then((m: Message) => {
                  this.allRoles.forEach((role) => {
                    if (
                      role.name === "Tank" &&
                      (tank === 1 || tank === undefined)
                    ) {
                      m.react(role.emoji);
                    }
                    if (
                      role.name === "Healer" &&
                      (healer === 1 || healer === undefined)
                    ) {
                      m.react(role.emoji);
                    }
                    if (
                      role.name === "DPS" &&
                      (dps !== 0 || dps === undefined)
                    ) {
                      m.react(role.emoji);
                    }
                  });
                  // create a collector to watch for reactions,
                  this.followReactions(m, keyEmbed);
                });
              }
            });
          }
        } else {
          throw new Error("No dungeons were found");
        }
      })
      .catch((err: Error) => {
        command.reply(
          `Sorry, I had some trouble fetching that information.\n\n${err.message}`
        );
      });
  }

  private followReactions(msg: Message, embed: MessageEmbed): void {
    const filter = (reaction: MessageReaction, user: User) => {
      const emojis = this.allRoles.map((r) => r.emoji);
      return emojis.indexOf(reaction.emoji.name) !== -1;
    };
    const roleCollector = msg.createReactionCollector(filter, {
      dispose: true,
    });
    roleCollector.on("collect", (reaction, user) => {
      if (!user.bot) {
        const roleToAssign = this.findRole(reaction);
        if (roleToAssign) {
          this.updateEmbed(embed, user, roleToAssign);
          msg.edit(embed);
        }
      }
    });
    roleCollector.on("remove", (reaction, user) => {
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
    return this.allRoles.find((r) => r.emoji === reaction.emoji.name)?.name;
  }

  private createEmbed(args: any): MessageEmbed {
    const key = args.key;
    const level = args.level;
    const tank = args.tank;
    const heal = args.heal;
    let dps = args.dps;
    const embed = new MessageEmbed().setColor("e6cc80");
    embed.setTitle(`[LFG] ${key} +${level}`);
    if (tank === 1 || tank === undefined) {
      embed.addField(":shield:", "...");
    }
    if (heal === 1 || heal === undefined) {
      embed.addField(":flag_ch:", "...");
    }
    dps = dps === undefined || dps > 3 ? 3 : dps;

    for (let i = 0; i < dps; i++) {
      embed.addField(":crossed_swords:", "...");
    }

    return embed;
  }

  private updateEmbed(
    embed: MessageEmbed,
    user: User,
    role: string,
    add = true
  ): void {
    const userTag = `<@${user.id}>`;
    let field = null;
    switch (role.toLocaleLowerCase()) {
      case "tank":
        field = embed.fields[0];
        if (field) {
          this.handleTankOrHeal(field, userTag, add);
        }
        break;
      case "healer":
        field = embed.fields[1];
        if (field) {
          this.handleTankOrHeal(field, userTag, add);
        }
        break;
      default:
        let arr = embed.fields.filter((f) => f.name === ":crossed_swords:");
        if (arr && arr.length) {
          this.handleDps(arr, userTag, add);
        }
        break;
    }
  }

  private handleTankOrHeal(
    field: EmbedField,
    userTag: string,
    add: boolean
  ): void {
    if (add) {
      // check if there's a spot available
      field.value = field.value === "..." ? userTag : field.value;
    } else {
      // if we're removing a reaction, we can only remove the tag if that user was actually tagged
      field.value = field.value === userTag ? "..." : field.value;
    }
  }

  private handleDps(fields: EmbedField[], userTag: string, add: boolean) {
    if (add) {
      fields.every((f) => {
        if (f.value === "...") {
          f.value = userTag;
          return false;
        }
      });
    } else {
      fields.every((f) => {
        if (f.value === userTag) {
          f.value = "...";
          return false;
        }
      });
    }
  }
}
