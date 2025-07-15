import { CredentialsManager } from "~/main/credentialsManager";
import { Mwn } from "mwn";

// Initialize credentials manager
const credentialsManager = new CredentialsManager();

const credentials = credentialsManager.getCredentials();

export const getCommonsBot = async () =>
  Mwn.init({
    apiUrl: "https://commons.wikimedia.org/w/api.php",
    ...credentials,
  });

export const getSourcesBot = async () =>
  Mwn.init({
    apiUrl: "https://uk.wikisource.org/w/api.php",
    ...credentials,
  });
