import { CredentialsManager } from "~/main/credentialsManager";
import { Mwn } from "mwn";

// Initialize credentials manager
const credentialsManager = new CredentialsManager();

export const getCommonsBot = async () => {
  const credentials = credentialsManager.getCredentials();
  return Mwn.init({
    apiUrl: "https://commons.wikimedia.org/w/api.php",
    ...credentials,
  });
};

export const getSourcesBot = async () => {
  const credentials = credentialsManager.getCredentials();
  return Mwn.init({
    apiUrl: "https://uk.wikisource.org/w/api.php",
    ...credentials,
  });
}
