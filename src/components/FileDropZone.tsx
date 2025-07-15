import React, { useCallback, useState } from 'react';

interface FileDropZoneProps {
  onFilesSelected: (files: Array<{ fileName: string; fileSize: number; filePath: string }>) => void;
  onSelectClick: () => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesSelected, onSelectClick }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const fileDataList = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        fileDataList.push({
          fileName: file.name,
          fileSize: file.size,
          filePath: file.path || file.name // Electron provides file.path
        });
      }
    }

    if (fileDataList.length > 0) {
      onFilesSelected(fileDataList);
    }
  }, [onFilesSelected]);

  return (
    <div 
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onSelectClick}
    >
      <div className="icon">📂</div>
      <p><strong>Перетягніть PDF файли сюди</strong></p>
      <p>або натисніть для вибору</p>
    </div>
  );
};

export default FileDropZone;
