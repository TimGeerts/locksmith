import { CommandMessage } from "@typeit/discord";
export const prefix = "?";
export const hasParams = (command: CommandMessage) => {
  return command?.args?.param;
};
