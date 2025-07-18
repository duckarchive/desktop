import path from "path";
import { Mwn } from "mwn";
import { parseFileName } from "~/main/parse";
import {
  createCasePage,
  createDescriptionPage,
  createFundPage,
} from "~/main/createPage";
import {
  upsertCaseToDescriptionPage,
  upsertDescriptionToFundPage,
  upsertFundToArchivePage,
} from "~/main/updatePage";
import { uploadFile } from "~/main/uploadFile";
import { getSourcesBot } from "~/main/bot";

/**
 * Progress callback interface for upload monitoring
 */
export interface UploadProgress {
  (progress: number, message: string): void;
}

const PREFIX = "Архів:";

/**
 * Enhanced publish function with progress tracking for Electron app
 * This reuses the existing publishFile logic with progress callbacks
 * @param filePath Path to the file to upload
 * @param onProgress Optional progress callback function
 */
export const publishFileWithProgress = async (
  filePath: string,
  onProgress?: UploadProgress,
) => {
  const progress = onProgress || (() => {});

  try {
    progress(5, "Ініціалізація з'єднання...");

    // Parse filename
    const fileName = path.basename(filePath);
    const parsed = parseFileName(fileName);
    if (!parsed) {
      throw new Error(
        `Назва файлу "${fileName}" не відповідає очікуваному формату.`
      );
    }

    progress(10, "Файл успішно проаналізовано...");

    const { archive, fund, description, caseName } = parsed;

    progress(15, "Підключення...");
    const sourcesBot = await getSourcesBot();

    progress(20, "Створення структури сторінок...");

    // Create missing pages, if they do not exist
    const archivePage = `${PREFIX}${archive}`;
    const fundPage = `${archivePage}/${fund}`;

    progress(25, "Створення сторінки фонду...");
    await createFundPage(sourcesBot, fundPage, parsed);

    const descriptionPage = `${fundPage}/${description}`;
    progress(30, "Створення сторінки опису...");
    await createDescriptionPage(sourcesBot, descriptionPage, parsed);

    const casePage = `${descriptionPage}/${caseName}`;
    progress(35, "Створення сторінки справи...");
    await createCasePage(sourcesBot, casePage, parsed);

    progress(40, "Оновлення навігаційних сторінок...");
    await upsertFundToArchivePage(sourcesBot, archivePage, parsed);

    progress(45, "Оновлення сторінки фонду...");
    await upsertDescriptionToFundPage(sourcesBot, fundPage, parsed);

    progress(50, "Оновлення сторінки опису...");
    await upsertCaseToDescriptionPage(sourcesBot, descriptionPage, parsed);

    progress(55, "Початок завантаження файлу...");

    // Upload file with progress tracking
    await uploadFile(filePath, parsed, (fileProgress) => {
      // Map file upload progress to 55-100% range
      const totalProgress = 55 + fileProgress * 0.45;
      progress(totalProgress, `Завантаження: ${fileProgress}%`);
    });

    progress(100, "Файл успішно завантажено!");

    // Generate the case page URL
    const casePageUrl = `https://uk.wikisource.org/wiki/${encodeURIComponent(
      casePage
    )}`;

    return {
      success: true,
      archivePage,
      fundPage,
      descriptionPage,
      casePage,
      casePageUrl,
      fileName,
    };
  } catch (error) {
    Mwn.log(`[E] Publish failed: ${error}`);
    throw error;
  }
};
