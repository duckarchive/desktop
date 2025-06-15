import { ParsedFileName } from "./parse";

export const getFundPage = ({
  title,
  dateRange,
}: {
  title?: string;
  dateRange?: string;
}) => {
  return `{{Архіви/фонд
  | назва = ${title || ""}
  | рік = ${dateRange || ""}
  | примітки = 
}}

== Описи ==
{| class="wikitable sortable"
!Опис!!Назва!!Роки!!Справ
|-
|[[/1/]]|| || ||
|}`;
};

export const getDescriptionPage = ({
  title,
  dateRange,
}: {
  title?: string;
  dateRange?: string;
}) => {
  return `{{Архіви/опис
  | назва = ${title || ""}
  | рік = ${dateRange || ""}
  | примітки = 
}}
== Справи ==
{| class="wikitable sortable"
!№!!Назва!!Роки!!Сторінки
|-
|[[/1/]]|| || ||
|}`;
};

export const getCasePageContent = ({
  title,
  dateRange,
  fileName,
}: {
  title: string;
  dateRange: string;
  fileName: string;
}) => {
  return `{{Архіви/справа
 | назва = ${title}
 | рік = ${dateRange}
 | примітки = ${fileNameToWikiText(fileName)}
}}

${fileNameToWikiText(fileName, true)}`;
};

export const getWikiTextForFile = ({
  archive,
  archiveFull,
  fund,
  description,
  caseName,
  dateRange,
}: ParsedFileName) => `
=={{int:filedesc}}==
{{Information
|description={{uk|1=${archive} ${fund}-${description} ${caseName}}}
|date=${dateRange}
|source=${archiveFull}
|author=${archiveFull}
|permission=
|other versions=
}}

=={{int:license-header}}==
{{PD-Ukraine}}{{PD-scan|PD-old-assumed-expired}}
`;

export const fileNameToWikiText = (fileName: string, isThumbnail?: boolean) => {
  if (isThumbnail) {
    return `[[File:${fileName}|thumb]]`;
  }

  return `[[c:File:${fileName}]]`;
};

export const generateWikiTable = (
  rows: {
    [column: string]: string;
  }[]
) => {
  if (rows.length === 0) {
    return "";
  }
  const columns = Object.keys(rows[0]);
  const header = `! ${columns.join(" !! ")}`;
  const body = rows
    .map((row) => {
      return `|-\n| ${columns.map((col) => row[col] || "").join(" || ")}`;
    })
    .join("\n");
  return `{| class="wikitable sortable"\n${header}\n${body}\n|}`;
};
