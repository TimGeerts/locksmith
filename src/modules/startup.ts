import { Client, Command, Once, ArgsOf, CommandMessage, Infos, Description } from '@typeit/discord';
import { Logger } from '../logger';

export abstract class Startup {
  // will be executed only once, when the bot is started and ready
  @Once('ready')
  // message parameter will always be an empty array here
  private ready(message: ArgsOf<'message'>, client: Client) {
    // init the logger namespace (so it can be used everywhere from now on)
    Logger.init(client);
    Logger.log(':robot: bot started bleep bloop bleep bloop :robot:');
  }

  @Command('restart')
  @Infos({ description: 'Does it really need explaining?', forAdmins: true })
  private restart(command: CommandMessage) {
    // TODO this should be set to only be allowed by specific roles, not everyone (maybe the forAdmins fixes that)
    command.reply('Very well master, restarting, brb... :wave:').then(() => {
      process.exit();
    });
  }
}
