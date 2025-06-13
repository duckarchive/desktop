const auth = {
  username: process.env.WIKI_BOT_USERNAME,
  password: process.env.WIKI_BOT_PASSWORD,
};

export const commonsOptions = {
  apiUrl: "https://commons.wikimedia.org/w/api.php",
  ...auth,
};

export const sourcesOptions = {
  apiUrl: "https://uk.wikisource.org/w/api.php",
  ...auth,
};