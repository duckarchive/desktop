import { Mwn } from "mwn";
import { ParsedFileName } from "./parse";
import {
  generateWikiTable,
} from "./templates";
import { sortBy, uniqBy } from "lodash";

export const upsertFundToArchivePage = async (
  bot: Mwn,
  page: string,
  { fund }: ParsedFileName
) => {
  let pageWithPostfix = page;
  if (fund.startsWith("Р")) {
    pageWithPostfix = `${page}/Р`;
  } else if (fund.startsWith("П")) {
    pageWithPostfix = `${page}/П`;
  } else {
    pageWithPostfix = `${page}/Д`;
  }

  await bot.edit(pageWithPostfix, ({ content }) => {
    const _tableContent = content
      .split('{| class="wikitable')[1]
      .split("|}")[0];
    const tableContent = `{| class="wikitable${_tableContent}|}`;
    const _tableHeader = tableContent.split("\n!")[1].split("\n")[0];
    const tableHeader = _tableHeader.replace(/\|/g, "!");
    const tableWithFixedHeader = tableContent.replace(
      _tableHeader,
      tableHeader
    );
    const parsedTableRows = bot.Wikitext.parseTable(tableWithFixedHeader);
    console.log(parsedTableRows);

    let indexHeader = "";
    const newItemRow = Object.fromEntries(
      Object.entries(parsedTableRows[0]).map(([key, value]) => {
        if (value.includes("[[")) {
          indexHeader = key;
          return [key, `[[../${fund}/]]`];
        }
        return [key, ""];
      })
    );
    const updatedTableRows = sortBy(
      uniqBy([...parsedTableRows, newItemRow], indexHeader),
      (row) => Number(row[indexHeader].match(/\d+/)?.[0] || "0")
    );
    const generatedTable = generateWikiTable(updatedTableRows);
    if (generatedTable === tableContent) {
      return {
        nochange: true,
      };
    } else {
      console.log(`Updating ${pageWithPostfix} with new table`);
      return {
        text: content.replace(tableContent, generatedTable),
        summary: "Додано новий фонд до архіву",
        minor: true,
      };
    }
  });
};
