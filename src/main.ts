import 'reflect-metadata';
import { Client } from '@typeit/discord';

export class Main {
  static start() {
    const client = new Client();
    require('dotenv').config();
    client.login(process.env.BOT_TOKEN, `${__dirname}/*.ts`); //needs bot token to work
  }
}
Main.start();
