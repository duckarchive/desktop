import path from "path";
import { getSourcesBot } from "~/main/bot";
import {
  createCasePage,
  createDescriptionPage,
  createFundPage,
} from "~/main/createPage";
import { parseFileName } from "~/main/parse";
import { upsertCaseToDescriptionPage, upsertDescriptionToFundPage, upsertFundToArchivePage } from "~/main/updatePage";
import { uploadFile } from "~/main/uploadFile";
import { Mwn } from "mwn";

const PREFIX = "Архів:";

const main = async (filePath: string) => {
  const fileName = path.basename(filePath);
  const parsed = parseFileName(fileName);
  if (!parsed) {
    throw new Error(
      `File name "${filePath}" does not match the expected format.`
    );
  }

  const {
    archive,
    fund,
    description,
    caseName
  } = parsed;

  const bot = await getSourcesBot();

  // create missing pages, if they do not exist
  const archivePage = `${PREFIX}${archive}`;
  const fundPage = `${archivePage}/${fund}`;
  await createFundPage(bot, fundPage, parsed);
  const descriptionPage = `${fundPage}/${description}`;
  await createDescriptionPage(bot, descriptionPage, parsed);
  const casePage = `${descriptionPage}/${caseName}`;
  await createCasePage(bot, casePage, parsed);

  await upsertFundToArchivePage(bot, archivePage, parsed);
  await upsertDescriptionToFundPage(bot, fundPage, parsed);
  await upsertCaseToDescriptionPage(bot, descriptionPage, parsed);

  await uploadFile(filePath, parsed);
};

const FILE_PATH = process.argv[2];
if (!FILE_PATH) {
  Mwn.log("[E] Usage: node publishFile.js <file_path>");
  process.exit(1);
}

main(FILE_PATH).catch((err) => {
  console.error("Error during publish:", err);
});
