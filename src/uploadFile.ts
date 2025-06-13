import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Mwn } from "mwn";
import { commonsOptions } from ".";
import { ARCHIVES } from "./archives";
import { getWikiTextForFile } from "./templates";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

interface ParsedFileName {
  archiveFull: string;
  archive: string;
  fund: string;
  description: string;
  case: string;
  dateRange: string;
  title: string;
}

export const parseFileName = (fileName: string): ParsedFileName | undefined => {
  const match = fileName.match(
    /^([А-ЯҐЄІЇа-яґєії]+)\s([\dА-ЯҐЄІЇа-яґєії]+)-([\dА-ЯҐЄІЇа-яґєії]+)-([\dА-ЯҐЄІЇа-яґєії]+)\.\s(\d{4}(?:-\d{4})?)\.\s(.+)$/i
  );
  if (!match) {
    return undefined;
  }
  const [_, a, f, d, c, dateRange, title] = match;

  if (
    !a ||
    !f ||
    !d ||
    !c ||
    !dateRange ||
    !title ||
    ARCHIVES[a] === undefined
  ) {
    return undefined;
  }

  return {
    archiveFull: ARCHIVES[a],
    archive: a,
    fund: f,
    description: d,
    case: c,
    dateRange: dateRange,
    title: title.trim(),
  };
};

export async function uploadFile(filePath: string) {
  const bot = await Mwn.init(commonsOptions);
  const csrfToken = await bot.getCsrfToken();

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(FILE_PATH).size;

  const parsed = parseFileName(fileName);

  if (!parsed) {
    throw new Error(
      `File name "${fileName}" does not match the expected format.`
    );
  }

  let offset = 0;
  let filekey: string | null = null;

  const fileStream = fs.createReadStream(FILE_PATH, {
    highWaterMark: CHUNK_SIZE,
  });

  for await (const chunk of fileStream) {
    const form = new FormData();
    form.append("action", "upload");
    form.append("filename", fileName);
    form.append("filesize", fileSize);
    form.append("format", "json");
    form.append("token", csrfToken);
    form.append("stash", "1");
    form.append("offset", offset.toString());
    if (filekey) form.append("filekey", filekey);
    form.append("chunk", chunk, {
      filename: fileName,
      contentType: "application/octet-stream",
    });

    const headers = {
      ...form.getHeaders(),
      "User-Agent": "ChunkedUploader/1.0",
    };

    const res = await bot.rawRequest({
      url: "https://commons.wikimedia.org/w/api.php",
      method: "POST",
      headers,
      data: form,
    });
    const data = res.data;

    if (
      data?.upload?.result !== "Continue" &&
      data?.upload?.result !== "Success"
    ) {
      throw new Error("Upload failed: " + JSON.stringify(data));
    }

    filekey = data.upload.filekey;
    offset += chunk.length;
    Mwn.log(
      `Chunk uploaded: offset=${offset}, filekey=${filekey}, progress=${(
        (offset / fileSize) *
        100
      ).toFixed(2)}%`
    );
  }

  // Finalize
  const finalizeForm = new FormData();
  finalizeForm.append("action", "upload");
  finalizeForm.append("filename", fileName);
  finalizeForm.append("filesize", fileSize);
  finalizeForm.append("format", "json");
  finalizeForm.append("token", csrfToken);
  finalizeForm.append("filekey", filekey);
  finalizeForm.append("ignorewarnings", "1");
  finalizeForm.append("comment", "Uploaded via script");

  const finalHeaders = {
    ...finalizeForm.getHeaders(),
    "User-Agent": "ChunkedUploader/1.0",
  };

  const finalRes = await bot.rawRequest({
    url: "https://commons.wikimedia.org/w/api.php",
    headers: finalHeaders,
    method: "POST",
    data: finalizeForm,
  });

  if (finalRes.data?.upload?.result !== "Success") {
    throw new Error("Final upload failed: " + JSON.stringify(finalRes.data));
  }

  Mwn.log(`File uploaded successfully: ${finalRes.data?.upload}`);

  const descriptionWikiText = getWikiTextForFile(fileName);

  await bot.edit(`File:${fileName}`, () => ({
    text: descriptionWikiText.trim(),
    summary: "Add file description and license",
  }));
}

const FILE_PATH = process.argv[2];
if (!FILE_PATH) {
  console.error("Usage: node uploadFile.js <file_path>");
  process.exit(1);
}

// uploadFile(FILE_PATH).catch((err) => {
//   console.error("Error during upload:", err);
// });
