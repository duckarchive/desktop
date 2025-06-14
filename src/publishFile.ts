import fs from "fs";
import path from "path";
import { Mwn } from "mwn";
import { sourcesOptions } from ".";
import {
  createCasePage,
  createDescriptionPage,
  createFundPage,
} from "./createPage";
import { parseFileName } from "./parse";
import { upsertFundToArchivePage } from "./updatePage";

const PREFIX = "Архів:";

const main = async (filePath: string) => {
  // const fileName = path.basename(filePath);
  const parsed = parseFileName(filePath);
  if (!parsed) {
    throw new Error(
      `File name "${filePath}" does not match the expected format.`
    );
  }

  const {
    archive,
    fund,
    description,
    case: caseNumber,
    dateRange,
    title,
  } = parsed;

  const bot = await Mwn.init(sourcesOptions);

  // create missing pages, if they do not exist
  const archivePage = `${PREFIX}${archive}`;
  const fundPage = `${archivePage}/${fund}`;
  await createFundPage(bot, fundPage, parsed);
  const descriptionPage = `${fundPage}/${description}`;
  await createDescriptionPage(bot, descriptionPage, parsed);
  const casePage = `${descriptionPage}/${caseNumber}`;
  await createCasePage(bot, casePage, parsed);

  await upsertFundToArchivePage(bot, archivePage, parsed);
};

const FILE_PATH = process.argv[2];
if (!FILE_PATH) {
  console.error("Usage: node publishFile.js <file_path>");
  process.exit(1);
}

main(FILE_PATH).catch((err) => {
  console.error("Error during publish:", err);
});
