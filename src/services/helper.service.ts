import { CommandMessage } from '@typeit/discord';

export const hasParams = (command: CommandMessage) => {
  return command?.args?.param;
};
