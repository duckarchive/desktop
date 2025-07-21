import React, { useState, useCallback } from "react";
import FileDropZone from "@/components/FileDropZone";
import { useElectronApi } from "@/providers/ElectronApiProvider";

interface ConversionProgress {
  progress: number;
  message: string;
}

interface ConversionOptions {
  format: "png" | "jpeg";
  quality: number;
  density: number;
}

const PdfToImagesConverter: React.FC = () => {
  const electronAPI = useElectronApi();
  const [selectedFile, setSelectedFile] = useState<RawFileItem>();
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [options, setOptions] = useState<ConversionOptions>({
    format: "png",
    quality: 100,
    density: 200,
  });

  const handleFileSelect = useCallback((files: RawFileItem[]) => {
    if (files.length > 0) {
      const file = files[0];
      if (file.fileName.toLowerCase().endsWith(".pdf")) {
        setSelectedFile(file);
        setConvertedImages([]);
        setProgress(null);
      } else {
        alert("Будь ласка, оберіть PDF файл");
      }
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setProgress({ progress: 0, message: "Підготовка..." });

    try {
      // Listen for progress updates
      electronAPI.pdfConverter.onProgress((data) => {
        setProgress(data);
      });

      const result = await electronAPI.pdfConverter.convertToImages(
        selectedFile.filePath,
        options
      );

      if (result.success && result.outputPaths) {
        setConvertedImages(result.outputPaths);
        setProgress({ progress: 100, message: result.message });
      } else {
        setProgress({
          progress: 0,
          message: `Помилка: ${result.error || result.message}`,
        });
      }
    } catch (error) {
      console.error("Conversion error:", error);
      setProgress({
        progress: 0,
        message: `Помилка: ${
          error instanceof Error ? error.message : "Невідома помилка"
        }`,
      });
    } finally {
      setIsConverting(false);
      electronAPI.pdfConverter.removeProgressListener();
    }
  }, [selectedFile, options, electronAPI]);

  const openImageLocation = useCallback(async (imagePath: string) => {
    try {
      // Use shell.showItemInFolder equivalent or openPath
      const { shell } = await import("electron");
      shell.showItemInFolder(imagePath);
    } catch (error) {
      console.error("Failed to open image location:", error);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(undefined);
    setConvertedImages([]);
    setProgress(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Конвертувати PDF в зображення
        </h2>

        <div className="space-y-4">
          <FileDropZone
            mode="pdf"
            onFilesSelected={handleFileSelect}
            isDisabled={isConverting}
          />

          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-3">
                Налаштування конвертації
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Формат
                  </label>
                  <select
                    value={options.format}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        format: e.target.value as "png" | "jpeg",
                      }))
                    }
                    disabled={isConverting}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Якість (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={options.quality}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        quality: parseInt(e.target.value) || 100,
                      }))
                    }
                    disabled={isConverting}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Роздільність (DPI)
                  </label>
                  <input
                    type="number"
                    min="72"
                    max="600"
                    value={options.density}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        density: parseInt(e.target.value) || 200,
                      }))
                    }
                    disabled={isConverting}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConverting ? "Конвертація..." : "Конвертувати в зображення"}
              </button>
            </div>
          )}

          {progress && (
            <div
              className={`border rounded-lg p-4 ${
                progress.progress === 0 && progress.message.includes("Помилка")
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-medium ${
                    progress.progress === 0 &&
                    progress.message.includes("Помилка")
                      ? "text-red-700"
                      : "text-blue-700"
                  }`}
                >
                  {progress.message}
                </span>
                {progress.progress > 0 && (
                  <span className="text-sm text-blue-600">
                    {Math.round(progress.progress)}%
                  </span>
                )}
              </div>
              {progress.progress > 0 && (
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {convertedImages.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-3">
                Конвертовано зображень: {convertedImages.length}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {convertedImages.map((imagePath, index) => (
                  <div
                    key={imagePath}
                    className="bg-white border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => openImageLocation(imagePath)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                        <span className="text-green-600 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Сторінка {index + 1}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {imagePath.split(/[/\\]/).pop()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-green-600 mt-3">
                Натисніть на зображення, щоб відкрити папку з файлом
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfToImagesConverter;
