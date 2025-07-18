import React from "react";
import { truncate } from "lodash";
import { Chip } from "@heroui/chip";
import CloseButton from "@/components/CloseButton";
import { Image } from "@heroui/image";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";

interface FileListItemProps {
  mode?: "pdf" | "image";
  file: FileItem;
  isInProgress: boolean;
  onRemoveFile: (fileId: string) => void;
}

const FileListItem: React.FC<FileListItemProps> = ({
  mode = "pdf",
  file,
  isInProgress,
  onRemoveFile,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default";
      case "uploading":
        return "primary";
      case "success":
        return "success";
      case "error":
        return "danger";
      default:
        return "default";
    }
  };

  if (mode === "image") {
    return (
      <div className="bg-gray-800 rounded-md flex items-center justify-between gap-2 p-2">
        <p onClick={onOpen} className="cursor-pointer">
          <span className="text-white font-medium">
            {file.fileName}
          </span>
          <span className="text-gray-400 text-sm ml-2">
            {formatFileSize(file.fileSize)}
          </span>
        </p>
        <CloseButton
          className="min-w-none min-w-none w-6 h-6"
          onPress={() => onRemoveFile(file.id)}
          disabled={isInProgress || file.status === "uploading"}
        />
        <Modal size="full" isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            <ModalHeader className="flex items-center gap-1 py-2 pl-2">
              {file.fileName}
              <Chip size="sm">{formatFileSize(file.fileSize)}</Chip>
            </ModalHeader>
            <ModalBody className="px-2 overflow-scroll">
              <Image
                src={`media://${file.filePath}`}
                alt={file.fileName}
                className="w-full object-cover rounded-none"
                loading="lazy"
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    );
  } else {
    return (
      <div className="flex justify-between gap-1 items-center p-4 border border-gray-200 rounded-md bg-white">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 font-medium mb-2 text-gray-800">
            <span
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              title={file.fileName}
            >
              {file.fileName}
            </span>
          </div>
          <div className="flex gap-2 items-center flex-wrap text-sm text-gray-600">
            <Chip>{formatFileSize(file.fileSize)}</Chip>
            <Chip color={getStatusColor(file.status)}>
              {getStatusText(file.status)}
            </Chip>
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
        <CloseButton
          onPress={() => onRemoveFile(file.id)}
          disabled={isInProgress || file.status === "uploading"}
        />
      </div>
    );
  }
};

export default FileListItem;
