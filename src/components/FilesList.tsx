import React from "react";
import FileListItem from "./FileListItem";
import clsx from "clsx";

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
    <div className={clsx("gap-1 max-h-[40vh] overflow-y-scroll", {
      "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4": mode === "image",
      "flex flex-col": mode === "pdf"
    })}>
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
