import React, { useState, useEffect } from "react";
import FileDropZone from "@/components/FileDropZone";
import FilesList from "@/components/FilesList";
import ProgressContainer from "@/components/ProgressContainer";
import UploadResults from "@/components/UploadResults";
import SettingsModal from "@/components/SettingsModal";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";
import { useToastHelpers } from "@/providers/ToastProvider";
import { parseFileName } from "@/helpers/parse";
import { uniqBy } from "lodash";
import InvalidNames from "@/components/InvalidNames";
import { WikiCredentials } from "~/main/uploadService";

const App: React.FC = () => {
  const { showError, showSuccess, showWarning } = useToastHelpers();
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
  const [showSettings, setShowSettings] = useState(false);
  const [username, setUsername] = useState<WikiCredentials['username'] | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'converter'>('upload');

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
        const status = await window.electronAPI.getCredentialsStatus();

        setUsername(status.username);

        // Show warning if credentials are missing
        if (!status.hasCredentials) {
          showError(
            "Облікові дані відсутні! Будь ласка, налаштуйте Вікімедіа-бота"
          );
        }
      }
    } catch (error) {
      console.error("Failed to load version:", error);
    }
  };

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

  const hasPendingFiles = selectedFiles.some(
    (f: FileItem) => f.status === "pending"
  );

  return (
    <main className="max-w-xl mx-auto flex flex-col gap-4 py-6">
      <header>
        <h1 className="text-xl">Менеджер Вікіджерел</h1>
        <div
          className="text-sm cursor-pointer"
          onClick={() => setShowSettings(true)}
          aria-label="Open settings modal"
        >
          {username ? (
            <span className="text-green-600">✅&nbsp;{username}</span>
          ) : (
            <span className="text-red-600">
              ❌ Облікові дані відсутні. Натисніть, щоб налаштувати.
            </span>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            File Upload
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'converter'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Image to PDF
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'upload' && (
        <>
          <FileDropZone onFilesSelected={handleAddFiles} isDisabled={isUploading} />

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

          <UploadResults show={showResults} results={uploadResults} onClose={handleClearFilesClick} />

          {selectedFiles.length > 0 && !isUploading && (
            <Button
              disabled={!hasPendingFiles}
              onClick={uploadFiles}
            >
              Почати публікацію
            </Button>
          )}
        </>
      )}

      {activeTab === 'converter' && (
        <ImageToPdfConverter />
      )}

      <Footer />

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
