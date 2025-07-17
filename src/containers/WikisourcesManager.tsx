import { useState, useEffect } from "react";
import FileDropZone from "@/components/FileDropZone";
import FilesList from "@/components/FilesList";
import ProgressContainer from "@/components/ProgressContainer";
import UploadResults from "@/components/UploadResults";
import SettingsModal from "@/components/SettingsModal";
import { useToastHelpers } from "@/providers/ToastProvider";
import { parseFileName } from "@/helpers/parse";
import { uniqBy } from "lodash";
import InvalidNames from "@/components/InvalidNames";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import { WikiCredentials } from "~/main/uploadService";
import { Button } from "@heroui/button";

const WikisourcesManager: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToastHelpers();
  const electronAPI = useElectronApi();
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [invalidFileNames, setInvalidFileNames] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState({
    value: 0,
    message: "Підготовка до публікації...",
  });
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [username, setUsername] = useState<WikiCredentials["username"]>();

  // Load app version and credentials status
  useEffect(() => {
    electronAPI
      .getCredentials()
      .then((status) => {
        if (!status.success || !status.credentials) {
          showError(
            "Облікові дані відсутні! Будь ласка, налаштуйте Вікімедіа-бота"
          );
        }
        setUsername(status.credentials?.username);
      })
      .catch((error) => {
        console.error("Failed to load credentials:", error);
        showError(
          "Помилка завантаження облікових даних: " + (error as Error).message
        );
      });

    electronAPI.onUploadProgress((data) => {
      setProgress({ value: data.progress, message: data.message });
    });
  }, []);

  const handleAddFiles = (fileDataList: RawFileItem[]) => {
    const validFiles: FileItem[] = [];
    const invalidFileNames: string[] = [];

    for (const fileData of fileDataList) {
      const parsedFileName = parseFileName(fileData.fileName);
      if (parsedFileName) {
        validFiles.push({
          ...fileData,
          id: Date.now() + Math.random().toString(),
          status: "pending",
          parsed: parsedFileName,
        });
      } else {
        invalidFileNames.push(fileData.fileName);
      }
    }

    setSelectedFiles((prev: FileItem[]) =>
      uniqBy([...prev, ...validFiles], "fileName")
    );

    // Show validation results
    if (invalidFileNames.length > 0) {
      setInvalidFileNames(invalidFileNames);
      showError(`Пропущено ${invalidFileNames.length} файл(ів)`);
    }
    if (validFiles.length > 0) {
      showSuccess(`Додано ${validFiles.length} файл(ів) до списку`);
    }
  };

  const clearInvalidNames = () => {
    setInvalidFileNames([]);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev: FileItem[]) =>
      prev.filter((f: FileItem) => f.id !== fileId)
    );
  };

  const handleClearFilesClick = () => {
    if (isUploading) return;

    setInvalidFileNames([]);
    setSelectedFiles([]);
    setUploadResults([]);
    setShowResults(false);
  };

  const uploadFiles = async () => {
    const pendingFiles = selectedFiles.filter(
      (f: FileItem) => f.status === "pending"
    );
    if (pendingFiles.length === 0 || isUploading) return;

    try {
      setIsUploading(true);
      setShowProgress(true);

      const results: UploadResult[] = [];
      let successCount = 0;
      let errorCount = 0;

      // Upload files one by one
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const progressText = `Завантаження ${i + 1} з ${pendingFiles.length}: ${
          file.fileName
        }`;

        setProgress({
          value: (i / pendingFiles.length) * 100,
          message: progressText,
        });

        // Update file status to uploading
        setSelectedFiles((prev: FileItem[]) =>
          prev.map((f: FileItem) =>
            f.id === file.id ? { ...f, status: "uploading" } : f
          )
        );

        try {
          // Start the upload for this file
          const result = await electronAPI.uploadFile(file.filePath);

          if (result.success) {
            setSelectedFiles((prev: FileItem[]) =>
              prev.map((f: FileItem) =>
                f.id === file.id
                  ? { ...f, status: "success", pageUrl: result.pageUrl }
                  : f
              )
            );
            successCount++;

            results.push({
              fileName: file.fileName,
              success: true,
              pageUrl: result.pageUrl,
              message: result.message,
            });
          } else {
            throw new Error(result.message);
          }
        } catch (fileError) {
          console.error(`Upload failed for ${file.fileName}:`, fileError);
          const errorMessage = (fileError as Error).message;

          setSelectedFiles((prev: FileItem[]) =>
            prev.map((f: FileItem) =>
              f.id === file.id
                ? { ...f, status: "error", error: errorMessage }
                : f
            )
          );
          errorCount++;

          results.push({
            fileName: file.fileName,
            success: false,
            error: errorMessage,
          });
        }
      }

      // Show final results
      setProgress({
        value: 100,
        message: `Завершено: ${successCount} успішно, ${errorCount} помилок`,
      });
      setUploadResults(results);
      setShowResults(true);
      setShowProgress(false);

      if (errorCount === 0) {
        showSuccess(`Всі файли (${successCount}) успішно опубліковано!`);
      } else if (successCount === 0) {
        showError(`Жоден файл не вдалося опублікувати (${errorCount} помилок)`);
      } else {
        showWarning(
          `${successCount} файлів опубліковано, ${errorCount} з помилками`
        );
      }
    } catch (error) {
      console.error("Upload process failed:", error);
      showError("Процес публікації не вдався: " + (error as Error).message);
      setProgress({ value: 0, message: "Публікація не вдалася" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="">
        <h2 className="text-xl font-semibold">Менеджер Вікіджерел</h2>
        <SettingsModal username={username} onSave={setUsername} />
      </header>

      <FileDropZone
        mode="pdf"
        onFilesSelected={handleAddFiles}
        isDisabled={!username || isUploading}
      />

      {invalidFileNames.length > 0 && (
        <InvalidNames
          invalidFileNames={invalidFileNames}
          onClose={clearInvalidNames}
        />
      )}

      <FilesList
        files={selectedFiles}
        onRemoveFile={removeFile}
        onClearAllFiles={handleClearFilesClick}
      />

      <ProgressContainer
        show={showProgress}
        progress={progress.value}
        message={progress.message}
      />

      <UploadResults show={showResults} results={uploadResults} />

      {selectedFiles.length > 0 && !isUploading && (
        <div className="flex justify-between items-center gap-2">
          <Button
            size="lg"
            variant="ghost"
            color="warning"
            onPress={handleClearFilesClick}
            disabled={isUploading}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Очистити список
          </Button>
          {!showResults && (
            <Button
              size="lg"
              color="primary"
              className="grow"
              onPress={uploadFiles}
            >
              Опублікувати
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default WikisourcesManager;
