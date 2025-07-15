import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Mwn } from "mwn";
import { getWikiTextForFile } from "~/main/templates";
import { ParsedFileName } from "~/main/parse";
import { getCommonsBot } from "~/main/bot";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

export const uploadFile = async (filePath: string, parsed: ParsedFileName, onProgress?: (progress: number) => void) => {
  const bot = await getCommonsBot();
  const csrfToken = await bot.getCsrfToken();

  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  let offset = 0;
  let filekey: string | null = null;

  const fileStream = fs.createReadStream(filePath, {
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
      timeout: 1000 * 60 * 3,
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
    if (onProgress) {
      const progress = Math.floor(Math.min((offset / fileSize) * 100, 100));
      onProgress(progress);
    }
    Mwn.log(
      `[I] Chunk uploaded: offset=${offset}, filekey=${filekey}, progress=${(
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
    timeout: 1000 * 60 * 3,
  });

  if (finalRes.data?.upload?.result !== "Success") {
    throw new Error("Final upload failed: " + JSON.stringify(finalRes.data));
  }

  Mwn.log(`[S] File uploaded successfully: ${finalRes.data?.upload?.imageinfo?.url}`);

  const descriptionWikiText = getWikiTextForFile(parsed);

  await bot.edit(`File:${fileName}`, () => ({
    text: descriptionWikiText.trim(),
    summary: "Add file description and license",
  }));
}
