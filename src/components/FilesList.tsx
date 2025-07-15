import React from "react";
import FileListItem from "./FileListItem";
import Button from "@/components/Button";

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
    <div className="backdrop-blur-md shadow-lg">
      <div className="flex justify-between items-center py-2 border-b border-gray-200">
        <h3 className="m-0">Вибрані файли ({files.length})</h3>
        {
          files.length > 0 && (
            <Button
              size="small"
              variant="secondary"
              onClick={onClearAllFiles}
            >
              Очистити список
            </Button>
          )
        }
      </div>
      <div className="flex flex-col gap-1 bg-gray-600 p-1 rounded-xl max-h-96 overflow-y-scroll">
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
