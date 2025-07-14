import fs from "fs";
import path from "path";
import FormData from "form-data";
import { Mwn } from "mwn";
import { commonsOptions } from "../index";
import { getWikiTextForFile } from "../templates";
import { ParsedFileName } from "../parse";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Progress callback interface for upload monitoring
 */
export interface UploadProgress {
  (progress: number, message: string): void;
}

/**
 * Enhanced upload function with progress tracking for Electron app
 * @param filePath Path to the file to upload
 * @param parsed Parsed filename information
 * @param onProgress Optional progress callback function
 */
export const uploadFileWithProgress = async (
  filePath: string, 
  parsed: ParsedFileName,
  onProgress?: UploadProgress
) => {
  const progress = onProgress || (() => {});
  
  try {
    progress(5, "Initializing connection to Wikimedia Commons...");
    
    const bot = await Mwn.init(commonsOptions);
    const csrfToken = await bot.getCsrfToken();

    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;

    progress(10, "Starting chunked upload...");

    let offset = 0;
    let filekey: string | null = null;

    const fileStream = fs.createReadStream(filePath, {
      highWaterMark: CHUNK_SIZE,
    });

    let chunkNumber = 0;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    for await (const chunk of fileStream) {
      chunkNumber++;
      const chunkProgress = 10 + (chunkNumber / totalChunks) * 70; // 10-80% for chunks
      
      progress(
        chunkProgress, 
        `Uploading chunk ${chunkNumber}/${totalChunks}...`
      );

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
        "User-Agent": "WikiManagerElectron/1.0",
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
      
      // Log progress for debugging
      Mwn.log(
        `[I] Chunk uploaded: offset=${offset}, filekey=${filekey}, progress=${(
          (offset / fileSize) *
          100
        ).toFixed(2)}%`
      );
    }

    progress(85, "Finalizing upload...");

    // Finalize the upload
    const finalizeForm = new FormData();
    finalizeForm.append("action", "upload");
    finalizeForm.append("filename", fileName);
    finalizeForm.append("filesize", fileSize);
    finalizeForm.append("format", "json");
    finalizeForm.append("token", csrfToken);
    finalizeForm.append("filekey", filekey);
    finalizeForm.append("ignorewarnings", "1");
    finalizeForm.append("comment", "Uploaded via Wikisource Manager Electron App");

    const finalHeaders = {
      ...finalizeForm.getHeaders(),
      "User-Agent": "WikiManagerElectron/1.0",
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

    progress(90, "Adding file description...");

    Mwn.log(`[S] File uploaded successfully: ${finalRes.data?.upload?.imageinfo?.url}`);

    // Add description to the file page
    const descriptionWikiText = getWikiTextForFile(parsed);

    await bot.edit(`File:${fileName}`, () => ({
      text: descriptionWikiText.trim(),
      summary: "Add file description and license via Wikisource Manager",
    }));

    progress(100, "Upload completed successfully!");

    return {
      success: true,
      url: finalRes.data?.upload?.imageinfo?.url,
      fileName: fileName
    };

  } catch (error) {
    Mwn.log(`[E] Upload failed: ${error}`);
    throw error;
  }
};

// Keep original function for backward compatibility
export { uploadFile } from "../uploadFile";
