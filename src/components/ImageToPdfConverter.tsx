import React, { useState, useEffect, useCallback } from "react";
import Button from "./Button";
import ProgressContainer from "./ProgressContainer";
import { useToastHelpers } from "@/providers/ToastProvider";
import { ImageToPdfEnvironmentStatus } from "@/containers/ImageToPdf";

interface ImageFile {
  filePath: string;
  fileName: string;
  fileSize: number;
}

interface ConversionOptions {
  dpi: number;
  rotation: "auto" | 0 | 90 | 180 | 270;
}

interface ImageToPdfConverterProps {
  environment: ImageToPdfEnvironmentStatus;
}

export const ImageToPdfConverter: React.FC<ImageToPdfConverterProps> = ({ environment }) => {
  const { showError } = useToastHelpers();
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<{
    progress: number;
    message: string;
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    outputPath?: string;
  } | null>(null);
  const [options, setOptions] = useState<ConversionOptions>({
    dpi: 300,
    rotation: "auto",
  });

  // Set up progress listener
  useEffect(() => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      return;
    }
    const handleProgress = (data: { progress: number; message: string }) => {
      setProgress(data);
    };

    window.electronAPI.imageConverter.onProgress(handleProgress);

    return () => {
      window.electronAPI?.imageConverter.removeProgressListener();
    };
  }, []);

  const handleSelectImages = async () => {
    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      const files = await window.electronAPI.openImages();
      if (files && files.length > 0) {
        setSelectedImages(files);
        setResult(null); // Clear previous result
      }
    } catch (error) {
      console.error("Error selecting images:", error);
    }
  };

  const handleConvert = async () => {
    if (selectedImages.length === 0) return;

    setIsConverting(true);
    setProgress(null);
    setResult(null);

    try {
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      // Get output path from user
      const outputPath = await window.electronAPI.savePdf(
        "converted_images.pdf"
      );
      if (!outputPath) {
        setIsConverting(false);
        return;
      }

      // Convert images
      const result = await window.electronAPI.imageConverter.convertToPdf(
        selectedImages.map((img) => img.filePath),
        {
          outputPath,
          ...options,
        }
      );

      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Conversion failed",
      });
    } finally {
      setIsConverting(false);
      setProgress(null);
    }
  };

  const removeImage = useCallback((filePath: string) => {
    setSelectedImages((prev) =>
      prev.filter((img) => img.filePath !== filePath)
    );
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (environment.checking) {
    return null;
  }

  // Main conversion interface
  return (
    <div className="bg-white rounded-lg p-6">
      {/* Only show conversion interface if environment is ready */}
      {!environment.needsSetup && (
        <>
          {/* Conversion Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DPI
              </label>
              <select
                value={options.dpi}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    dpi: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={150}>150 DPI</option>
                <option value={300}>300 DPI</option>
                <option value={600}>600 DPI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Поворот
              </label>
              <select
                value={options.rotation}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    rotation: e.target.value as ConversionOptions["rotation"],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Автоматично</option>
                <option value={0}>0°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </div>
          </div>

          {/* File Selection */}
          <div className="">
            <Button onClick={handleSelectImages} disabled={isConverting}>
              Вибрати зображення
            </Button>
          </div>

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">
                Вибрані зображення ({selectedImages.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedImages.map((image) => (
                  <div
                    key={image.filePath}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(image.fileSize)}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeImage(image.filePath)}
                      variant="secondary"
                      size="small"
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      Видалити
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Convert Button */}
          {selectedImages.length > 0 && (
            <div className="mb-4">
              <Button
                onClick={handleConvert}
                disabled={isConverting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConverting
                  ? "Конвертуємо..."
                  : `Конвертувати ${selectedImages.length} зображенн${
                      selectedImages.length === 1
                        ? "я"
                        : selectedImages.length >= 2 && selectedImages.length <= 4
                        ? "я"
                        : "ь"
                    } у PDF`}
              </Button>
            </div>
          )}

          {/* Progress */}
          {isConverting && progress && (
            <ProgressContainer
              show={true}
              progress={progress.progress}
              message={progress.message}
            />
          )}

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-md ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className={result.success ? "text-green-700" : "text-red-700"}>
                {result.message}
              </p>
              {result.success && result.outputPath && (
                <p className="text-green-600 text-sm mt-1">
                  Збережено у: {result.outputPath}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageToPdfConverter;
