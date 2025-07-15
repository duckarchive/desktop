import React, { useState, useEffect } from "react";
import FileDropZone from "@/components/FileDropZone";
import FilesList from "@/components/FilesList";
import ProgressContainer from "@/components/ProgressContainer";
import UploadResults from "@/components/UploadResults";
import SettingsModal from "@/components/SettingsModal";
import Footer from "@/components/Footer";
import { useToastHelpers } from "@/providers/ToastProvider";

const App: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToastHelpers();
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState({
    value: 0,
    message: "Підготовка до публікації...",
  });
  const [showProgress, setShowProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState("Завантаження...");
  const [credentialsStatus, setCredentialsStatus] = useState<any>(null);

  // Load app version and credentials status
  useEffect(() => {
    loadAppVersion();

    // Listen for upload progress updates
    if (window.electronAPI) {
      window.electronAPI.onUploadProgress((data) => {
        setProgress({ value: data.progress, message: data.message });
      });
    }
  }, []);

  const loadAppVersion = async () => {
    try {
      if (window.electronAPI) {
        const version = await window.electronAPI.getVersion();
        const status = await window.electronAPI.getCredentialsStatus();

        setAppVersion(version);
        setCredentialsStatus(status);

        // Show warning if credentials are missing
        if (!status.hasCredentials) {
          showError(
            "Облікові дані відсутні! Будь ласка, налаштуйте свої облікові дані Вікімедіа-бота за допомогою кнопки Налаштування."
          );
        }
      }
    } catch (error) {
      console.error("Failed to load version:", error);
      setAppVersion("Невідома");
    }
  };

  const validateFileName = async (fileName: string) => {
    try {
      if (!window.electronAPI) {
        return {
          isValid: false,
          error: "Electron API недоступне",
        };
      }

      const result = await window.electronAPI.validateFileName(fileName);
      return result;
    } catch (error) {
      console.error("Filename validation failed:", error);
      return {
        isValid: false,
        error: "Помилка валідації: " + (error as Error).message,
      };
    }
  };

  const addFiles = async (
    fileDataList: Array<{
      fileName: string;
      fileSize: number;
      filePath: string;
    }>
  ) => {
    const validFiles: FileItem[] = [];
    const invalidFiles: Array<{ fileName: string; error: string }> = [];

    // Validate each file
    for (const fileData of fileDataList) {
      const exists = selectedFiles.some(
        (f: FileItem) =>
          f.fileName === fileData.fileName && f.fileSize === fileData.fileSize
      );
      if (exists) {
        continue; // Skip duplicates
      }

      // Validate filename format
      const validation = await validateFileName(fileData.fileName);
      if (validation.isValid) {
        validFiles.push({
          ...fileData,
          id: Date.now() + Math.random().toString(), // Unique ID for each file
          status: "pending",
          parsed: validation.parsed,
        });
      } else {
        invalidFiles.push({
          fileName: fileData.fileName,
          error: validation.error || "Невідома помилка",
        });
      }
    }

    // Add valid files to selection
    setSelectedFiles((prev: FileItem[]) => [...prev, ...validFiles]);

    // Show validation results
    if (invalidFiles.length > 0) {
      showFileValidationErrors(invalidFiles, validFiles.length);
    } else if (validFiles.length > 0) {
      showSuccess(`Додано ${validFiles.length} файл(ів) до списку`);
    }

    // if (validFiles.length > 0 || invalidFiles.length === 0) {
    //   setTimeout(hideMessage, 3000);
    // }
  };

  const showFileValidationErrors = (
    invalidFiles: Array<{ fileName: string; error: string }>,
    validCount: number
  ) => {
    const errorList = invalidFiles
      .map((f) => `• ${f.fileName}: ${f.error}`)
      .join("<br>");

    const formatExample = "ЦДАВО Р-1-2-3. 1920-1930. Назва документу.pdf";
    const formatDescription = `
        <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px; text-align: left;">
            <strong>Очікуваний формат назви файлу:</strong><br>
            <code style="background: #e9ecef; padding: 0.2rem 0.4rem; border-radius: 3px;">${formatExample}</code><br><br>
            <strong>Структура:</strong><br>
            • <strong>АРХІВ</strong> - код архіву (наприклад: ЦДАВО, ДАЛО, ЦДІАК)<br>
            • <strong>Фонд</strong> - номер або код фонду (наприклад: Р-1, 123, А-45)<br>
            • <strong>Опис-Справа</strong> - через дефіс (наприклад: 2-3, 15-248)<br>
            • <strong>Роки</strong> - рік або діапазон років (наприклад: 1920, 1920-1930)<br>
            • <strong>Назва</strong> - описова назва документу<br><br>
            <strong>Приклади правильних назв:</strong><br>
            • ЦДАВО Р-1-2-3. 1920. Протокол засідання.pdf<br>
            • ДАЛО 123-4-56. 1925-1930. Листування.pdf<br>
            • ЦДІАК А-789-10-11. 1918. Акт передачі.pdf
        </div>
    `;

    let messageText = `<strong>Помилки у назвах файлів (${invalidFiles.length}):</strong><br>${errorList}`;

    if (validCount > 0) {
      messageText = `<strong>Додано ${validCount} файл(ів). Помилки у ${invalidFiles.length} файлах:</strong><br>${errorList}`;
    }

    messageText += formatDescription;

    showError(messageText);
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev: FileItem[]) =>
      prev.filter((f: FileItem) => f.id !== fileId)
    );
  };

  const clearFiles = () => {
    if (isUploading) return;

    setSelectedFiles([]);
    setUploadResults([]);
    setShowResults(false);
    // hideMessage();
  };

  const uploadFiles = async () => {
    const pendingFiles = selectedFiles.filter(
      (f: FileItem) => f.status === "pending"
    );
    if (pendingFiles.length === 0 || isUploading) return;

    try {
      setIsUploading(true);
      setShowProgress(true);
      // hideMessage();

      if (!window.electronAPI) {
        throw new Error("Electron API недоступне");
      }

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
          const result = await window.electronAPI.uploadFile(file.filePath);

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

      if (errorCount === 0) {
        showSuccess(`Всі файли (${successCount}) успішно опубліковано!`);
      } else if (successCount === 0) {
        showError(`Жоден файл не вдалося опублікувати (${errorCount} помилок)`);
      } else {
        showWarning(`${successCount} файлів опубліковано, ${errorCount} з помилками`);
      }
    } catch (error) {
      console.error("Upload process failed:", error);
      showError("Процес публікації не вдався: " + (error as Error).message);
      setProgress({ value: 0, message: "Публікація не вдалася" });
    } finally {
      setIsUploading(false);
    }
  };

  const hasPendingFiles = selectedFiles.some(
    (f: FileItem) => f.status === "pending"
  );

  return (
    <main className="max-w-xl mx-auto">
      <header className="mb-4">
        <h1 className="text-xl">Менеджер Вікіджерел</h1>
        <ul className="text-gray-300 list-outside">
          <li>Автоматичне створення/оновлення сторінок</li>
          <li>Публікація PDF-файлів</li>
          <li>Підтримка мультифайлового завантаження</li>
        </ul>
      </header>

      <FileDropZone onFilesSelected={addFiles} />

      <FilesList files={selectedFiles} onRemoveFile={removeFile} />

      <ProgressContainer
        show={showProgress}
        progress={progress.value}
        message={progress.message}
      />

      <UploadResults show={showResults} results={uploadResults} />

      <div style={{ marginTop: "2rem" }}>
        <button
          className="btn"
          disabled={!hasPendingFiles || isUploading}
          onClick={uploadFiles}
        >
          Почати публікацію
        </button>
        <button
          className="btn secondary"
          style={{
            display: selectedFiles.length > 0 ? "inline-block" : "none",
          }}
          onClick={clearFiles}
        >
          Очистити список
        </button>
      </div>

      <Footer
        version={appVersion}
        credentialsStatus={credentialsStatus}
        onOpenSettings={() => setShowSettings(true)}
      />

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        onCredentialsUpdated={loadAppVersion}
        onMessage={() => {}}
      />
    </main>
  );
};

export default App;
