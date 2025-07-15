import path from "path";
import { Mwn } from "mwn";
import { ParsedFileName, parseFileName } from "~/main/parse";
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

/**
 * Progress callback interface for upload monitoring
 */
export interface UploadProgress {
  (progress: number, message: string): void;
}

/**
 * Credentials interface
 */
export interface WikiCredentials {
  username: string;
  password: string;
}

const PREFIX = "Архів:";

/**
 * Enhanced publish function with progress tracking for Electron app
 * This reuses the existing publishFile logic with progress callbacks
 * @param filePath Path to the file to upload
 * @param onProgress Optional progress callback function
 * @param credentials Wikimedia bot credentials
 */
export const publishFileWithProgress = async (
  filePath: string,
  onProgress?: UploadProgress,
  credentials?: WikiCredentials
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

    // Initialize bots with credentials
    const sourcesOptions = {
      apiUrl: "https://uk.wikisource.org/w/api.php",
      username: credentials?.username,
      password: credentials?.password,
    };

    const commonsOptions = {
      apiUrl: "https://commons.wikimedia.org/w/api.php",
      username: credentials?.username,
      password: credentials?.password,
    };

    progress(15, "Підключення...");
    const sourcesBot = await Mwn.init(sourcesOptions);

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
    // We'll modify uploadFile to accept credentials and progress
    await uploadFileWithCredentials(
      filePath,
      parsed,
      (fileProgress, message) => {
        // Map file upload progress to 55-100% range
        const totalProgress = 55 + fileProgress * 0.45;
        progress(totalProgress, message);
      }
    );

    progress(100, "Публікацію завершено успішно!");

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

/**
 * Upload file with credentials and progress tracking
 * This is a wrapper around the existing uploadFile function
 */
async function uploadFileWithCredentials(
  filePath: string,
  parsed: ParsedFileName,
  onProgress?: (progress: number, message: string) => void
) {
  const progress = onProgress || (() => {});

  // Use the existing uploadFile function
  await uploadFile(filePath, parsed, (fileProgress) => {
    // Map file upload progress to 10-100% range
    const totalProgress = fileProgress;
    progress(totalProgress, `Завантаження: ${fileProgress}%`);
  });

  progress(100, "Файл успішно завантажено!");
}
