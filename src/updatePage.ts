import { Mwn } from "mwn";
import { ParsedFileName } from "./parse";
import {
  getCasePageContent,
  getDescriptionPage,
  getFundPage,
} from "./templates";

export const upsertFundToArchivePage = async (
  bot: Mwn,
  page: string,
  data: ParsedFileName
) => {
  let pageWithPostfix = page;
  if (data.fund.startsWith("Р")) {
    pageWithPostfix = `${page}/Р`;
  } else if (data.fund.startsWith("П")) {
    pageWithPostfix = `${page}/П`;
  } else {
    pageWithPostfix = `${page}/Д`;
  }

  await bot.edit(pageWithPostfix, ({ content }) => {
    const _tableContent = content.split('{| class="wikitable')[1].split('|}')[0];
    const tableContent = `{| class="wikitable${_tableContent}|}`;
    const _tableHeader = tableContent.split('\n!')[1].split('\n')[0];
    const tableHeader = _tableHeader.replace(/\|/g, '!');
    const tableWithFixedHeader = tableContent.replace(_tableHeader, tableHeader);
    const parsedTable = bot.Wikitext.parseTable(tableWithFixedHeader);
    console.log(parsedTable);
    return {};
  });
};
