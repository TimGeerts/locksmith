import { Command, CommandMessage, Description } from '@typeit/discord';

export abstract class Corruption {
  @Command('corruption :param')
  @Description('Lists the currently purchasable corruptions')
  async corruption(command: CommandMessage) {
    command.reply(
      ":squid: N'zoth called, it wants its corruption back, no more borrowed power for you friend!!! :squid:"
    );
  }
}
