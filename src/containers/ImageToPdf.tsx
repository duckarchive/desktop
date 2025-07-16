import { useEffect, useState, useCallback } from "react";
import EnvironmentSetupModal from "@/components/EnvironmentSetupModal";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import ProgressContainer from "@/components/ProgressContainer";
import { useToastHelpers } from "@/providers/ToastProvider";
import FileDropZone from "@/components/FileDropZone";

interface ImageToPdfEnvironmentStatus {
  checking: boolean;
  pythonAvailable: boolean;
  pythonPath?: string;
  pythonVersion?: string;
  img2pdfAvailable: boolean;
  img2pdfVersion?: string;
  img2pdfExePath?: string;
  isWindows: boolean;
  needsSetup: boolean;
  setupInstructions?: string[];
  error?: string;
}

interface ImageFile {
  filePath: string;
  fileName: string;
  fileSize: number;
}

const DPI_OPTIONS = [
  {
    label: "150 DPI",
    value: "150",
  },
  {
    label: "300 DPI",
    value: "300",
  },
  {
    label: "600 DPI",
    value: "600",
  },
];

const ROTATION_OPTIONS = [
  { label: "Автоматично", value: "auto" },
  { label: "0°", value: "0" },
  { label: "90°", value: "90" },
  { label: "180°", value: "180" },
  { label: "270°", value: "270" },
];

const ImageToPdf: React.FC = () => {
  const electronAPI = useElectronApi();
  const [environment, setEnvironment] = useState<ImageToPdfEnvironmentStatus>({
    checking: true,
    pythonAvailable: false,
    img2pdfAvailable: false,
    isWindows: false,
    needsSetup: false,
  });
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
  const [dpi, setDpi] = useState<string>("300");
  const [rotation, setRotation] = useState<string>("auto");

  // Check environment on component mount
  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    setEnvironment((prev) => ({ ...prev, checking: true }));

    try {
      const result = await electronAPI.imageConverter.checkEnvironment();
      setEnvironment({
        checking: false,
        pythonAvailable: result.pythonAvailable,
        pythonPath: result.pythonPath,
        pythonVersion: result.pythonVersion,
        img2pdfAvailable: result.img2pdfAvailable,
        img2pdfVersion: result.img2pdfVersion,
        img2pdfExePath: result.img2pdfExePath,
        isWindows: result.isWindows,
        needsSetup: result.needsSetup,
        setupInstructions: result.setupInstructions,
        error: result.error,
      });
    } catch (error) {
      setEnvironment({
        checking: false,
        pythonAvailable: false,
        img2pdfAvailable: false,
        isWindows: false,
        needsSetup: true,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Set up progress listener
  useEffect(() => {
    const handleProgress = (data: { progress: number; message: string }) => {
      setProgress(data);
    };

    electronAPI.imageConverter.onProgress(handleProgress);

    return () => {
      electronAPI.imageConverter.removeProgressListener();
    };
  }, []);

  const handleSelectImages = async (files: RawFileItem[]) => {
    if (files && files.length > 0) {
      setSelectedImages(files);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (selectedImages.length === 0) return;

    setIsConverting(true);
    setProgress(null);
    setResult(null);

    try {
      if (!electronAPI) {
        showError("Electron API недоступне");
        return;
      }
      // Get output path from user
      const outputPath = await electronAPI.savePdf("converted_images.pdf");
      if (!outputPath) {
        setIsConverting(false);
        return;
      }

      // Convert images
      const result = await electronAPI.imageConverter.convertToPdf(
        selectedImages.map((img) => img.filePath),
        {
          outputPath,
          dpi,
          rotation,
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

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">Зображення в PDF</h2>
        <EnvironmentSetupModal onEnvironmentChange={checkEnvironment} />
      </header>

      {/* Only show conversion interface if environment is ready */}
      {!environment.needsSetup && (
        <>
          <FileDropZone
            mode="image"
            onFilesSelected={handleSelectImages}
            isDisabled={isConverting}
          />
          {/* Conversion Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="DPI"
                defaultSelectedKeys={[dpi]}
                onSelectionChange={([newDpi]) => setDpi(newDpi.toString())}
                className="w-full"
              >
                {DPI_OPTIONS.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Поворот"
                defaultSelectedKeys={[rotation]}
                onSelectionChange={([newRotation]) =>
                  setRotation(newRotation.toString())
                }
                className="w-full"
              >
                {ROTATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
            </div>
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
                      onPress={() => removeImage(image.filePath)}
                      color="secondary"
                      size="sm"
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
                onPress={handleConvert}
                disabled={isConverting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isConverting
                  ? "Конвертуємо..."
                  : `Конвертувати ${selectedImages.length} зображенн${
                      selectedImages.length === 1
                        ? "я"
                        : selectedImages.length >= 2 &&
                          selectedImages.length <= 4
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

export default ImageToPdf;
