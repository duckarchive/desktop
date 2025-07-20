import { Mwn } from "mwn";
import { ParsedFileName } from "~/main/parse";
import { generateWikiTable, getArchivePageTable, getDescriptionPageTable, getFundPageTable } from "~/main/templates";
import { sortBy, uniqBy } from "lodash";

const TABLE_START = '{| class="wikitable';
const TABLE_END = "|}";

export const extractTable = (content: string) => {
  const _tableContent = content.split(TABLE_START)[1].split(TABLE_END)[0];
  const cachedTableContent = `${TABLE_START}${_tableContent}${TABLE_END}`;
  const tableContent = `${TABLE_START}${_tableContent.replace(
    /\|-\s{0,}\n{0,}$/g,
    ""
  )}${TABLE_END}`;
  const _tableHeader = tableContent.split("\n!")[1].split("\n")[0];
  const tableHeader = _tableHeader.replace(/\|/g, "!");
  const tableWithFixedHeader = tableContent.replace(_tableHeader, tableHeader);

  return {
    raw: cachedTableContent,
    extracted: tableWithFixedHeader
  };
};

const upsertItemToTable = (
  bot: Mwn,
  _content: string,
  item: string,
  fallbackContent: string,
  parsed?: ParsedFileName
) => {
  const content = _content.replace(/\{\|\s{0,}class="wikitable/, TABLE_START);
  const { extracted, raw } = extractTable(content);

  let parsedTableRows: Record<string, string>[] = [];
  try {
    parsedTableRows = bot.Wikitext.parseTable(extracted);
  } catch (error) {
    Mwn.log(`[E] Error parsing table: ${_content}`);
    throw error;
  }

  if (!parsedTableRows.length && fallbackContent) {
    Mwn.log(`[W] No rows found in the table. Generating fallback content.`);
    const updated = content.replace(raw, fallbackContent);
    return upsertItemToTable(bot, updated, item, "", parsed);
  }

  let indexHeader = "";
  const newItemRow = Object.fromEntries(
    Object.entries(parsedTableRows[0]).map(([key, value]) => {
      if (value.includes("[[")) {
        indexHeader = key;
        const [start, _, end] = value.split("/");
        return [key, `${start}/${item}/${end}`];
      }
      if (key === "Назва") {
        return [key, parsed?.title || ""];
      }
      if (key === "Рік" || key === "Роки" || key === "Дата") {
        return [key, parsed?.dateRange || ""];
      }
      return [key, ""];
    })
  );
  const updatedTableRows = sortBy(
    uniqBy([...parsedTableRows, newItemRow], indexHeader),
    (row) => Number(row[indexHeader].match(/\d+/)?.[0] || "0")
  );
  const generatedTable = generateWikiTable(updatedTableRows);
  const updated = content.replace(raw, generatedTable);
  if (updated === _content) {
    Mwn.log(`[S] Table is already up to date`);
    return {
      text: content,
    };
  } else {
    Mwn.log(`[S] Updated table with new item: ${item}`);
    return {
      text: updated,
      summary:
        parsedTableRows.length === updatedTableRows.length
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
  } else if (page.includes(":ЦД")) {
    // central archives don't have fund splitting by period
    pageWithPostfix = `${page}`;
  } else {
    pageWithPostfix = `${page}/Д`;
  }

  await bot.edit(pageWithPostfix, ({ content }) =>
    upsertItemToTable(bot, content, fund, getArchivePageTable())
  );
};

export const upsertDescriptionToFundPage = async (
  bot: Mwn,
  page: string,
  { description }: ParsedFileName
) => {
  await bot.edit(page, ({ content }) =>
    upsertItemToTable(bot, content, description, getFundPageTable())
  );
};

export const upsertCaseToDescriptionPage = async (
  bot: Mwn,
  page: string,
  parsed: ParsedFileName
) => {
  await bot.edit(page, ({ content }) =>
    upsertItemToTable(bot, content, parsed.caseName, getDescriptionPageTable(), parsed)
  );
};
