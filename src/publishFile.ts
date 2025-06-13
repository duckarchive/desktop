import fs from "fs";
import path from "path";
import { parseFileName } from "./uploadFile";
import { Mwn } from "mwn";
import { sourcesOptions } from ".";
import { getCasePageContent, getDescriptionPage, getFundPage } from "./templates";

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

  // check if the fund page exists
  const fundPage = await bot.read(`${PREFIX}${archive}/${fund}`);
  if (fundPage.missing) {
    // create the fund page
    await bot.create(`${PREFIX}${archive}/${fund}`, getFundPage({}), `Створення сторінки фонду ${fund}`);
  }

  // check if the description page exists
  const descriptionPage = await bot.read(
    `${PREFIX}${archive}/${fund}/${description}`
  );
  if (descriptionPage.missing) {
    // create the description page
    await bot.create(
      `${PREFIX}${archive}/${fund}/${description}`,
      getDescriptionPage({}),
      `Створення сторінки опису ${description}`
    );
  }

  // check if the case page exists
  const casePage = await bot.read(
    `${PREFIX}${archive}/${fund}/${description}/${caseNumber}`
  );
  if (casePage.missing) {
    // create the case page
    await bot.create(
      `${PREFIX}${archive}/${fund}/${description}/${caseNumber}`,
      getCasePageContent({
        title: title || caseNumber,
        dateRange: dateRange || "",
        fileName: path.basename(filePath),
      }),
      `Створення сторінки справи ${caseNumber}`
    );
  }
};

const FILE_PATH = process.argv[2];
if (!FILE_PATH) {
  console.error("Usage: node publishFile.js <file_path>");
  process.exit(1);
}

main(FILE_PATH).catch((err) => {
  console.error("Error during publish:", err);
});
