import { MessageEmbed } from "discord.js";
import { Command, CommandMessage, Description } from "@typeit/discord";
import { hasParams } from "../services/helper.service";
import { getGuides } from "../services/resource.service";
import { IGuide } from "../types";

export abstract class Guides {
  private allGuides: IGuide[];

  @Command("guide :param")
  @Description(
    "Lists raid guides (written and/or youtube) for the chosen boss encounter"
  )
  async guides(command: CommandMessage) {
    getGuides()
      .then((g: IGuide[]) => {
        if (g && g.length) {
          this.allGuides = g;
        } else {
          throw new Error("No guides were found");
        }
      })
      .then(() => {
        if (!hasParams(command)) {
          // no params, so list out all available guides
          command.reply(this.replyGuideList());
        } else {
          // request for a specific guide
          const specific = command.args.param.toString().toLocaleLowerCase();
          command.reply(this.replyGuide(specific));
        }
      })
      .catch((err: Error) => {
        command.reply(
          `Sorry, I had some trouble fetching that information.\n\n${err.message}`
        );
      });
  }

  private replyGuideList(): MessageEmbed {
    const embed = new MessageEmbed()
      .setTitle(`Available guide commands`)
      .setColor(0xfaa61a);
    this.allGuides.forEach((boss) => {
      if (boss.tags && boss.tags.length) {
        embed.addField(`**${boss.name}:**`, `\`?guide ${boss.tags[0]}\``);
      }
    });
    return embed;
  }

  private replyGuide(g: string): MessageEmbed {
    const guide = this.allGuides.find(
      (b) => b.tags.map((l) => l.toLowerCase()).indexOf(g.toLowerCase()) > -1
    );
    const embed = new MessageEmbed()
      .setTitle(`__${guide.name} Mythic - ${guide.raid}__`)
      .setColor(0xfaa61a);
    if (guide.thumbnail) {
      embed.setThumbnail(guide.thumbnail);
    }
    if (guide.description) {
      embed.setDescription(guide.description);
    }
    if (guide.wowhead) {
      embed.addField("Wowhead", guide.wowhead, true);
    }
    if (guide.youtube) {
      embed.addField("Youtube", guide.youtube);
    }
    if (guide.extra && guide.extra.length) {
      guide.extra.forEach((e) => {
        embed.addField(e.name, e.content);
      });
    }
    return embed;
  }
}
