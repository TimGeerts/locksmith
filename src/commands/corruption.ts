import DiscordJS = require('discord.js');
import { Interval, isWithinInterval, format, isFuture } from 'date-fns';
import { Command, CommandMessage, Description } from '@typeit/discord';
import { getCorruptions, getCorruptionBatches } from '../services/resource.service';

interface ICorruption {
  batch: number;
  name: string;
  rank: number;
  price: number;
}

interface ICorruptionBatch {
  batch: number;
  intervals: Interval[];
}

interface IActiveContaminents {
  batch: number;
  start: string;
  end: string;
}

export abstract class Corruption {
  private activeContaminents: IActiveContaminents;
  private corruptionBatches: ICorruptionBatch[];
  private batchNumber: number;
  private nextBatchNumber: number;

  @Command('corruption :param')
  @Description('Lists the currently purchasable corruptions')
  async corruption(command: CommandMessage) {
    // get all corruptionbatches
    getCorruptionBatches()
      .then((b: ICorruptionBatch[]) => {
        if (b && b.length) {
          this.corruptionBatches = b;
        } else {
          throw new Error('No corruptionbatches were found');
        }
      })
      .then(() => {
        // this promise makes sure we have the corruptionBatches array available
        // so now we can start handling the command itself
        const showNext = command.args.param === 'next';
        if (!command.args.param || showNext) {
          //reply overall corruption info
          this.replyOverall(command, showNext);
        } else {
          // reply specific corruption info
          const specific = command.args.param.toString().toLocaleLowerCase();
          this.replySpecific(command, specific);
        }
      })
      .catch((err: Error) => {
        command.reply(`Sorry, I had some trouble fetching that information.\n\n${err.message}`);
      });
  }

  //only works when using the exact first word of the corruption name (eg. "honed" for Honed Mind, etc...)
  private replySpecific(command: CommandMessage, specificCorruption: string): void {
    getCorruptions()
      .then((corruptions: ICorruption[]) => {
        // get all the corruptions matching the filter given by the command
        corruptions = corruptions?.filter((c) => c.name.toLocaleLowerCase().startsWith(specificCorruption));
        if (corruptions && corruptions.length) {
        } else {
          throw new Error(`No corruption info was found for your request`);
        }
        // sort them based on rank, assuming people want info on the highest rank first
        // corruptions.sort((c1, c2) => (c1.rank < c2.rank ? 1 : -1));
        // now we have to find the earliest future batch that has this specific corruption (per rank)
        const result = new Array<{
          name: string;
          rank: number;
          start: string;
          end: string;
          isNow: boolean;
          seq: number | Date;
        }>();
        corruptions.forEach((c) => {
          const today = new Date();
          let matchingBatch = this.corruptionBatches.find((b) => b.batch === c.batch);
          let isAvailableNow = false;
          let earliestInterval = matchingBatch?.intervals.find((i) => {
            isAvailableNow = isWithinInterval(today, { start: new Date(i.start), end: new Date(i.end) });
            return isAvailableNow || isFuture(new Date(i.start));
          });
          if (!earliestInterval) {
            throw new Error('Something went wrong');
          }
          result.push({
            name: c.name,
            rank: c.rank,
            start: format(new Date(earliestInterval.start), 'MMMM do'),
            end: format(new Date(earliestInterval.end), 'MMMM do'),
            isNow: isAvailableNow,
            seq: earliestInterval.start,
          });
        });
        // order them so that the earliest occurrence of the corruption (disregarding rank) gets displayed first
        result.sort((r1, r2) => (r1.seq < r2.seq ? -1 : 1));
        const corNames = result.map((c) => c.name).join('\n');
        const corRanks = result.map((c) => c.rank).join('\n');
        const corIntervals = result.map((c) => (c.isNow ? 'Currently for sale' : `${c.start} until ${c.end}`));
        const embed = new DiscordJS.MessageEmbed()
          .setColor('#a330c9')
          .setTitle('Corruption Vendor')
          .setDescription('The following table shows the next availability for your chosen corruption')
          .setURL('https://corruptionvendor.com/')
          .addFields(
            { name: 'Corruption', value: corNames, inline: true },
            { name: 'Rank', value: corRanks, inline: true },
            { name: 'Available', value: corIntervals, inline: true }
          );
        command.reply(embed);
      })
      .catch((err: Error) => {
        command.reply(`Sorry, I had some trouble fetching that information.\n\n${err.message}`);
      });
  }

  private replyOverall(command: CommandMessage, showNext: boolean = false): void {
    const batchNumber = this.currentBatch();
    if (!batchNumber) {
      throw new Error('No corruptionbatches were found');
    }
    const nextBatchNumber = batchNumber + 1 > 8 ? 1 : batchNumber + 1;

    getCorruptions().then((corruptions: ICorruption[]) => {
      corruptions = corruptions?.filter((c) => c.batch === (showNext ? nextBatchNumber : batchNumber));
      if (corruptions && corruptions.length) {
        corruptions.sort((c1, c2) => c1.name.localeCompare(c2.name));
        const corNames = corruptions.map((c) => c.name).join('\n');
        const corRanks = corruptions.map((c) => c.rank).join('\n');
        const corPrices = corruptions.map((c) => c.price).join('\n');
        const desc = `Preserved contaminents for sale from ${this.activeContaminents.start} until ${this.activeContaminents.end}`;
        const nextDesc = 'Next time the vendor changes, the following contaminents will be for sale';
        const embed = new DiscordJS.MessageEmbed()
          .setColor('#a330c9')
          .setTitle('Corruption Vendor')
          .setDescription(showNext ? nextDesc : desc)
          .setURL('https://corruptionvendor.com/')
          .addFields(
            { name: 'Corruption', value: corNames, inline: true },
            { name: 'Rank', value: corRanks, inline: true },
            { name: 'Price', value: corPrices, inline: true }
          );
        command.reply(embed);
      } else {
        throw new Error('No corruptions were found');
      }
    });
  }

  // helpers
  // gets the current batch of corruptions (based on "today")
  private currentBatch(): number {
    const d = new Date();
    const curBatch = this.corruptionBatches.find((b) => this.matchInterval(d, b));
    if (!curBatch) {
      throw new Error('No corruptionbatch was found for the current date');
    }
    return curBatch.batch;
  }

  // find the matching interval in the list of intervals a specific batch has
  private matchInterval(date: Date, batch: ICorruptionBatch): ICorruptionBatch {
    //check if "date" is in any of this batches intervals
    let activeInterval = batch.intervals.find((i) =>
      isWithinInterval(date, { start: new Date(i.start), end: new Date(i.end) })
    );
    if (activeInterval) {
      this.activeContaminents = {
        batch: batch.batch,
        start: format(new Date(activeInterval.start), 'MMMM do'),
        end: format(new Date(activeInterval.end), 'MMMM do'),
      };
    }
    return activeInterval ? batch : null;
  }
}
