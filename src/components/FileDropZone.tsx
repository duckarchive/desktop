import { useToastHelpers } from "@/providers/ToastProvider";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import clsx from "clsx";
import React, { useCallback, useState } from "react";
import { SUPPORTED_IMAGE_FORMATS } from "~/main/supportedImageFormats";

interface FileDropZoneProps {
  mode?: "pdf" | "image";
  onFilesSelected: (files: RawFileItem[]) => void;
  isDisabled?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  mode = "pdf",
  onFilesSelected,
  isDisabled,
}) => {
  const { showError } = useToastHelpers();
  const electronAPI = useElectronApi();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length === 0) return;
      const targetType = mode === "pdf" ? "application/pdf" : "image/";
      const targetExtensions =
        mode === "pdf" ? ["pdf"] : SUPPORTED_IMAGE_FORMATS;

      const fileDataList = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type.includes(targetType) ||
          targetExtensions.includes(
            file.name.toLowerCase().split(".").pop() || "none"
          )
        ) {
          fileDataList.push({
            fileName: file.name,
            fileSize: file.size,
            filePath: file.path || file.name, // Electron provides file.path
          });
        }
      }

      if (fileDataList.length > 0) {
        onFilesSelected(fileDataList);
      }
    },
    [onFilesSelected]
  );

  const handleSelectClick = useCallback(() => {
    const openMethod =
      mode === "pdf" ? electronAPI.openPDFs : electronAPI.openImages;
    try {
      openMethod().then((fileDataList) => {
        if (fileDataList && fileDataList.length > 0) {
          onFilesSelected(fileDataList);
        }
      });
    } catch (error) {
      console.error("File selection failed:", error);
      showError("Не вдалося вибрати файли: " + (error as Error).message);
    }
  }, []);

  return (
    <button
      className={clsx(
        `w-full
        p-12
        bg-white
        rounded-xl
        border-4 border-dashed border-gray-500 hover:border-green-500 disabled:border-transparent
        text-center text-gray-800 disabled:text-gray-400
        cursor-pointer disabled:cursor-not-allowed
        transition-all duration-300`,
        {
          "border-green-500 text-gray-800": isDragOver,
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSelectClick}
      disabled={isDisabled}
    >
      <div className="text-5xl mb-4 opacity-70">📂</div>
      <p className="text-xl font-semibold">
        Перетягніть {mode === "pdf" ? "PDF файли" : "файли зображень"} сюди
      </p>
      <p>або натисніть для вибору</p>
    </button>
  );
};

export default FileDropZone;
