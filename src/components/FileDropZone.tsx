import { useToastHelpers } from "@/providers/ToastProvider";
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
      if (!window.electronAPI) {
        showError("Electron API недоступне");
        return;
      }

      window.electronAPI
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
        `w-full bg-white border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-green-500 hover:bg-white`,
        {
          "border-gray-500": !isDragOver,
          "border-green-500 bg-green-50": isDragOver,
        }
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSelectClick}
      disabled={isDisabled}
    >
      <div className="text-5xl mb-4 opacity-70">📂</div>
      <p className="my-2 text-gray-600">
        <strong className="text-gray-800 text-xl">
          Перетягніть PDF файли сюди
        </strong>
      </p>
      <p className="my-2 text-gray-600">або натисніть для вибору</p>
    </button>
  );
};

export default FileDropZone;
