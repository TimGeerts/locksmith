import fetch from 'node-fetch';

const API_URL = ''; //won't work without the api url
const apiGet = (url: string) =>
  fetch(`${API_URL}${url}`)
    .then((r) => r.json())
    .catch((r) => r.statusText);

export const getCorruptions = async () => {
  return apiGet('corruptions.json');
};

export const getCorruptionBatches = async () => {
  return apiGet('corruptionbatches.json');
};

// export class ResourceService {
//   private apiUrl: string;

//   constructor() {
//     const maybeFirebaseUrl = 'https://eighthsin-d0536.firebaseio.com/'; // update to process.env.API;
//     if (maybeFirebaseUrl === undefined) {
//       throw new Error('');
//     }
//     this.apiUrl = maybeFirebaseUrl;
//   }

//   public getCorruption() {
//     return `getting corruption from the url ${this.apiUrl}corruptions.json`;
//     // const URL = `${this.apiUrl}corruptions.json`;
//     // return this.getResource(URL);
//   }

//   // public getReminders() {
//   //   const URL = `${this.apiUrl}reminders.json`;
//   //   return this.getResource(URL);
//   // }

//   private async getResource(url: string) {
//     const r = await fetch(url);
//     if (r.ok) {
//       return r.json();
//     }
//     throw new Error(r.statusText);
//   }
// }
