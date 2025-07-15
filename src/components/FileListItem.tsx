import React from "react";
import clsx from "clsx";
import { truncate } from "lodash";
import Button from "./Button";

interface FileListItemProps {
  file: FileItem;
  isInProgress: boolean;
  onRemoveFile: (fileId: string) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({
  file,
  isInProgress,
  onRemoveFile,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "uploading":
        return "🔄";
      case "success":
        return "✅";
      case "error":
        return "❌";
      default:
        return "⏳";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Очікує";
      case "uploading":
        return "Завантажується...";
      case "success":
        return "Опубліковано";
      case "error":
        return "Помилка";
      default:
        return "Очікує";
    }
  };

  return (
    <div className="flex justify-between gap-1 items-center p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 font-medium mb-2 text-gray-800">
          <span className="text-lg min-w-5">{getStatusIcon(file.status)}</span>
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            title={file.fileName}
          >
            {file.fileName}
          </span>
        </div>
        <div className="flex gap-2 items-center flex-wrap text-sm text-gray-600">
          <span className="bg-gray-100 px-2 py-1 rounded font-mono">
            {formatFileSize(file.fileSize)}
          </span>
          <span className="px-2 py-1 rounded font-medium bg-gray-200 text-gray-700">
            {getStatusText(file.status)}
          </span>
          {file.status === "success" && file.pageUrl && (
            <a
              href={file.pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 no-underline px-2 py-1 rounded transition-all duration-300 hover:bg-blue-600 hover:text-white"
            >
              🔗 Переглянути сторінку
            </a>
          )}
          {file.status === "error" && file.error && (
            <div
              className="text-red-600 text-xs bg-red-100 px-2 py-1 rounded max-w-xs"
              title={file.error}
            >
              Помилка:&nbsp;
              {truncate(file.error, {
                length: 50,
                omission: "...",
              })}
            </div>
          )}
        </div>
      </div>
      <button
        className={clsx(
          "flex-shrink-0 w-6 h-6 rounded-full text-md font-bold border-0",
          {
            "bg-gray-300 cursor-not-allowed opacity-60": isInProgress,
            "bg-red-500 text-white cursor-pointer": !isInProgress,
          }
        )}
        onClick={() => onRemoveFile(file.id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

export default FileListItem;
