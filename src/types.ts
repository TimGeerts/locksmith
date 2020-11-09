export interface IRole {
  name: string;
  role: string;
  emoji: string;
}

export interface IStoredMessage {
  channelId: string;
  messageId: string;
}

export interface IDungeon {
  name: string;
  tags: string[];
}

// fallback emojis are in case the custom ones don't exist on the server
export enum Emoji {
  Tank = '🛡️',
  TankFallBack = '🛡️',
  Healer = '775365038172536900',
  HealerFallBack = '🇨🇭',
  Dps = '⚔️',
  DpsFallBack = '⚔️',
  // Healer = '773893882957135883', //(localhost custom emoji)
}
