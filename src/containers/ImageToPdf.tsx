import { useEffect, useState, useCallback } from "react";
import EnvironmentSetupModal from "@/components/EnvironmentSetupModal";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Accordion, AccordionItem } from "@heroui/accordion";
import ProgressContainer from "@/components/ProgressContainer";
import FileDropZone from "@/components/FileDropZone";
import FilesList from "@/components/FilesList";
import { FileNameInput } from "@/components/FileNameInput";

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
  const [selectedImages, setSelectedImages] = useState<FileItem[]>([]);
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
  const [dpi, setDpi] = useState<string>("150");
  const [rotation, setRotation] = useState<string>("auto");
  const [fileNameInput, setFileNameInput] = useState<string>("default");

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
      setSelectedImages(
        files.map((file) => ({
          ...file,
          id: file.filePath,
          status: "pending",
        }))
      );
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (selectedImages.length === 0) return;

    setIsConverting(true);
    setProgress(null);
    setResult(null);

    try {
      const outputPath = await electronAPI.savePdf(`${fileNameInput}.pdf`);
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

  const handleClearFilesClick = () => {
    setSelectedImages([]);
    setResult(null);
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

          <FilesList
            mode="image"
            files={selectedImages}
            onRemoveFile={removeImage}
          />

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

          {/* Convert Button */}
          {selectedImages.length > 0 && !isConverting && (
            <>
              <div className="flex flex-col gap-0">
                <FileNameInput onChange={setFileNameInput} />
                <Accordion variant="splitted" className="px-0 opacity-75" itemClasses={{
                  title: "font-semibold py-0 text-sm text-right text-gray-300",
                  base: "rounded-t-none bg-gray-700",
                  trigger: "py-1",
                  titleWrapper: "py-0",
                }}>
                  <AccordionItem
                    key="1"
                    aria-label="Налаштування конвертації"
                    title="Додаткові параметри PDF"
                  >
                    <div className="flex justify-end gap-2">
                      <Select
                        size="sm"
                        label="DPI"
                        defaultSelectedKeys={[dpi]}
                        onSelectionChange={([newDpi]) => setDpi(newDpi.toString())}
                        className="basis-1/4"
                      >
                        {DPI_OPTIONS.map((option) => (
                          <SelectItem key={option.value}>{option.label}</SelectItem>
                        ))}
                      </Select>

                      <Select
                        size="sm"
                        label="Поворот"
                        defaultSelectedKeys={[rotation]}
                        onSelectionChange={([newRotation]) =>
                          setRotation(newRotation.toString())
                        }
                        className="basis-1/4"
                      >
                        {ROTATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value}>{option.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  </AccordionItem>
                </Accordion>
              </div>
              <div className="flex justify-between items-center gap-2">
                <Button
                  size="lg"
                  variant="ghost"
                  color="warning"
                  onPress={handleClearFilesClick}
                  disabled={isConverting}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Очистити всі {selectedImages.length} файли(ів)
                </Button>
                <Button
                  size="lg"
                  color="primary"
                  className="grow"
                  onPress={handleConvert}
                  disabled={isConverting}
                >
                  {isConverting ? "Конвертуємо..." : `Конвертувати`}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ImageToPdf;
