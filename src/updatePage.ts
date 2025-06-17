import { Mwn } from "mwn";
import { ParsedFileName } from "./parse";
import { generateWikiTable } from "./templates";
import { sortBy, uniqBy } from "lodash";

const upsertItemToTable = (bot: Mwn, content: string, item: string) => {
  const _tableContent = content.split('{| class="wikitable')[1].split("|}")[0].replace(/\|-\n$/, '');
  const tableContent = `{| class="wikitable${_tableContent}|}`;
  const _tableHeader = tableContent.split("\n!")[1].split("\n")[0];
  const tableHeader = _tableHeader.replace(/\|/g, "!");
  const tableWithFixedHeader = tableContent.replace(_tableHeader, tableHeader);
  let parsedTableRows: Record<string, string>[] = [];
  try {
    parsedTableRows = bot.Wikitext.parseTable(tableWithFixedHeader);
  } catch (error) {
    Mwn.log(`[E] Error parsing table: ${content}`);
    throw error;
  }

  let indexHeader = "";
  const newItemRow = Object.fromEntries(
    Object.entries(parsedTableRows[0]).map(([key, value]) => {
      if (value.includes("[[")) {
        indexHeader = key;
        const [start, _, end] = value.split("/");
        return [key, `${start}/${item}/${end}`];
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
    Mwn.log(`[S] Table is already up to date`);
    return {
      text: content,
    };
  } else {
    Mwn.log(`[S] Updated table with new item: ${item}`);
    return {
      text: content.replace(tableContent, generatedTable),
      summary: parsedTableRows.length === updatedTableRows.length
        ? "Відформатовано таблицю."
        : "Додано новий елемент до таблиці та відформатовано.",
      minor: true,
    };
  }
};

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

  await bot.edit(pageWithPostfix, ({ content }) =>
    upsertItemToTable(bot, content, fund)
  );
};

export const upsertDescriptionToFundPage = async (
  bot: Mwn,
  page: string,
  { description }: ParsedFileName
) => {
  await bot.edit(page, ({ content }) =>
    upsertItemToTable(bot, content, description)
  );
};

export const upsertCaseToDescriptionPage = async (
  bot: Mwn,
  page: string,
  { caseName }: ParsedFileName
) => {
  await bot.edit(page, ({ content }) =>
    upsertItemToTable(bot, content, caseName)
  );
};
