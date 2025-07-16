import { useToastHelpers } from "@/providers/ToastProvider";
import { useElectronApi } from "@/providers/ElectronApiProvider";
import clsx from "clsx";
import React, { useCallback, useState } from "react";

interface FileDropZoneProps {
  onFilesSelected: (files: RawFileItem[]) => void;
  isDisabled?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
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

      const fileDataList = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
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
    try {
      electronAPI
        .openFiles()
        .then((fileDataList) => {
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
        `w-full bg-white border-4 border-dashed rounded-xl p-12 text-center transition-all duration-300`,
        {
          "border-gray-500 hover:border-green-500 text-gray-800 hover:bg-white cursor-pointer": !isDragOver && !isDisabled,
          "border-green-500 bg-green-50 text-gray-800": isDragOver,
          "cursor-not-allowed text-gray-400": isDisabled,
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
        Перетягніть PDF файли сюди
      </p>
      <p>або натисніть для вибору</p>
    </button>
  );
};

export default FileDropZone;
