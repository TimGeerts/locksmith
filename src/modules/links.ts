import { MessageEmbed } from "discord.js";
import { Interval, isWithinInterval, format, isFuture } from "date-fns";
import { Command, CommandMessage, Description, Client } from "@typeit/discord";
import { getLinks } from "../services/resource.service";
import { IQuickLink } from "../types";

export abstract class Corruption {
  private links: IQuickLink[];

  @Command("link :param")
  @Description(
    "Lists the available quicklinks or a specific one if a parameter is provided"
  )
  async link(command: CommandMessage, client: Client) {
    getLinks()
      .then((lnks: IQuickLink[]) => {
        if (lnks && lnks.length) {
          // if there's no parameter, list out all available links
          if (!command.args.param) {
            const embed = new MessageEmbed()
              .setColor("#c97a30")
              .setTitle("Available links")
              .setDescription("The following link commands are available");

            lnks.forEach((l) => {
              embed.addField(`!link ${l.command}`, l.description);
            });
            command.reply(embed);
          } else {
            // try to find the specific link that's asked for in the parameter
            const specific = command.args.param.toString().toLocaleLowerCase();
            const l = lnks.find(
              (l) => l.command.toLocaleLowerCase() === specific
            );
            if (l) {
              command.reply(l.content);
            } else {
              throw new Error(
                `No link was found for the command \`\`!link ${specific}\`\``
              );
            }
          }
        } else {
          throw new Error("No links were found");
        }
      })
      .catch((err: Error) => {
        command.reply(
          `Sorry, I had some trouble fetching that information.\n\n${err.message}`
        );
      });
  }
}
