import React from "react";
import FileListItem from "./FileListItem";
import { Button } from "@heroui/button";

interface FilesListProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
  onClearAllFiles: () => void;
}

const FilesList: React.FC<FilesListProps> = ({ files, onRemoveFile, onClearAllFiles }) => {
  if (files.length === 0) {
    return null;
  }

  const isInProgress = files.some((file) => file.status === "uploading");

  return (
    <>
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          isInProgress={isInProgress}
          onRemoveFile={onRemoveFile}
        />
      ))}
    </>
  );
};

export default FilesList;
