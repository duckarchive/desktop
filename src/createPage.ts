import { Mwn } from "mwn";
import { ParsedFileName } from "./parse";
import { getCasePageContent, getDescriptionPage, getFundPage } from "./templates";

export const createFundPage = async (
  bot: Mwn,
  page: string,
  data: ParsedFileName
) => {
  // check if the fund page exists
  const fundPage = await bot.read(page);
  if (fundPage.missing) {
    // create the fund page
    Mwn.log(`Creating fund page for ${data.fund} in archive ${data.archive}`);
    await bot.create(
      page,
      getFundPage(data),
      `Створення сторінки фонду ${data.fund}`
    );
  }
};

export const createDescriptionPage = async (
  bot: Mwn,
  page: string,
  data: ParsedFileName
) => {
  // check if the description page exists
  const descriptionPage = await bot.read(page);
  if (descriptionPage.missing) {
    // create the description page
    Mwn.log(
      `Creating description page for ${data.description} in fund ${data.fund}`
    );
    await bot.create(
      page,
      getDescriptionPage({}),
      `Створення сторінки опису ${data.description}`
    );
  }
};

export const createCasePage = async (
  bot: Mwn,
  page: string,
  data: ParsedFileName
) => {
  // check if the case page exists
  const casePage = await bot.read(page);
  if (casePage.missing) {
    // create the case page
    Mwn.log(
      `Creating case page for ${data.caseName} in description ${data.description}`
    );
    await bot.create(
      page,
      getCasePageContent({
        title: data.title,
        dateRange: data.dateRange || "",
        fileName: data.fileName,
      }),
      `Створення сторінки справи ${data.caseName}`
    );
  }
};
