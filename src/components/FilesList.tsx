import React from "react";
import FileListItem from "./FileListItem";

interface FilesListProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
}

const FilesList: React.FC<FilesListProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  const isInProgress = files.some((file) => file.status === "uploading");

  return (
    <div className="backdrop-blur-md shadow-lg">
      <h3 className="m-0 mb-1">
        Вибрані файли ({files.length})
      </h3>
      <div className="rounded-xl max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
        {files.map((file) => (
          <FileListItem
            key={file.id}
            file={file}
            isInProgress={isInProgress}
            onRemoveFile={onRemoveFile}
          />
        ))}
      </div>
    </div>
  );
};

export default FilesList;
