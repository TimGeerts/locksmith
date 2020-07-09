import 'reflect-metadata';
import { Client } from '@typeit/discord';

export class Main {
  static start() {
    const client = new Client();
    client.login('', `${__dirname}/*.ts`); //needs bot token to work
  }
}
Main.start();
