// import { pdf } from 'pdf-to-img';
import { Poppler } from "node-poppler";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";
import file from "mwn/build/file";

export interface PdfConversionOptions {
  format?: "png" | "jpeg";
  quality?: number;
  density?: number;
  outputDir?: string;
}

export interface PdfConversionProgress {
  (progress: number, message: string): void;
}

export class PdfConverter {
  /**
   * Convert PDF to images
   */
  async convertPdfToImages(
    pdfPath: string,
    options: PdfConversionOptions = {},
    onProgress?: PdfConversionProgress
  ): Promise<string[]> {
    const {
      format = "png",
      quality = 100,
      density = 200,
      outputDir = path.join(app.getPath("temp"), "pdf-images"),
    } = options;

    try {
      onProgress?.(0, "Початок конвертації PDF...");

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      onProgress?.(10, "Читання PDF файлу...");

      // Convert PDF to images
      const poppler = new Poppler();
      const options = {
        jpegFile: true,
      };
      const outputFile = path.join(
        path.dirname(pdfPath),
        path.basename(pdfPath, path.extname(pdfPath))
      );

      const res = await poppler.pdfToCairo(pdfPath, outputFile, options);
      console.log("PDF to images conversion result:", res);
      onProgress?.(30, "Конвертація сторінок...");

      // let counter = 1;
      // const imagePaths: string[] = [];
      // for await (const image of document) {
      //   const imagePath = path.join(outputDir, `page${counter}.${format}`);
      //   fs.writeFileSync(imagePath, image);
      //   const progress = 30 + (counter / document.length) * 60;
      //   onProgress?.(progress, `Конвертовано сторінку ${counter} з ${document.length}`);
      //   imagePaths.push(imagePath);
      //   counter++;
      // }

      // for await (const image of document) {
      //   const imagePath = path.join(outputDir, `page${counter}.${format}`);
      //   console.log(`Конвертація сторінки ${counter}...`, imagePath);
      //   fs.writeFileSync(imagePath, image);
      //   const progress = 30 + (counter / document.length) * 60;
      //   onProgress?.(
      //     progress,
      //     `Конвертовано сторінку ${counter} з ${document.length}`
      //   );
      //   imagePaths.push(imagePath);
      //   counter++;
      // }

      onProgress?.(100, "Конвертація завершена!");
      return [];
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Невідома помилка";
      throw new Error(`Помилка конвертації PDF: ${errorMessage}`);
    }
  }

  /**
   * Get PDF page count
   */
  async getPdfPageCount(pdfPath: string): Promise<number> {
    try {
      // const document = await pdf(pdfPath, {
      //   scale: 3,
      // });

      // return document.length;
      return 1;
    } catch (error) {
      throw new Error(`Не вдалося визначити кількість сторінок: ${error}`);
    }
  }
}
