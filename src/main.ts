import 'reflect-metadata';
import { Client } from '@typeit/discord';

export class Main {
  static start() {
    const client = new Client();
    client.login('NzI5MzE0Njc3Mzg0ODA2NDIz.XwHJZg.Qr3GHcdjvve_VnuyGygOckk_6rk', `${__dirname}/*.ts`);
  }
}
Main.start();
