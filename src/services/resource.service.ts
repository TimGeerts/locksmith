import fetch from "node-fetch";

const API_URL = process.env.FB_API; //won't work without the api url
const apiGet = (url: string) =>
  fetch(`${API_URL}${url}`)
    .then((r) => r.json())
    .catch((r) => r.statusText);

export const getReminders = async () => {
  return apiGet("reminders.json");
};

export const getLinks = async () => {
  return apiGet("links.json");
};

export const getGuides = async () => {
  return apiGet("guides.json");
};

export const getRoles = async () => {
  return apiGet("roles.json");
};

export const getDungeons = async () => {
  return apiGet("dungeons.json");
};
