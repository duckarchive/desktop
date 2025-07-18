import React from "react";
import FileListItem from "./FileListItem";

interface FilesListProps {
  mode?: "pdf" | "image";
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
}

const FilesList: React.FC<FilesListProps> = ({ mode = "pdf", files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  const isInProgress = files.some((file) => file.status === "uploading");

  return (
    <div className="gap-1 max-h-[40vh] overflow-y-scroll flex flex-col">
      {files.map((file) => (
        <FileListItem
          key={file.id}
          mode={mode}
          file={file}
          isInProgress={isInProgress}
          onRemoveFile={onRemoveFile}
        />
      ))}
    </div>
  );
};

export default FilesList;
