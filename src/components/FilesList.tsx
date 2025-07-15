
interface FilesListProps {
  files: FileItem[];
  onRemoveFile: (fileId: string) => void;
}

const FilesList: React.FC<FilesListProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'uploading': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Очікує';
      case 'uploading': return 'Завантажується...';
      case 'success': return 'Опубліковано';
      case 'error': return 'Помилка';
      default: return 'Очікує';
    }
  };

  const isInProgress = files.some(file => file.status === 'uploading');

  return (
    <div id="files-list" style={{ display: files.length > 0 ? 'block' : 'none' }}>
      <h3>Вибрані файли ({files.length})</h3>
      <div className="files-container">
        {files.map((file) => (
          <div key={file.id} className="file-item">
            <div className="file-info">
              <div className="file-name">
                <span className="status-icon">{getStatusIcon(file.status)}</span>
                <span title={file.fileName}>{file.fileName}</span>
              </div>
              <div className="file-details">
                <span className="file-size">{formatFileSize(file.fileSize)}</span>
                <span className="file-status">{getStatusText(file.status)}</span>
                {file.status === 'success' && file.pageUrl && (
                  <a href={file.pageUrl} target="_blank" rel="noopener noreferrer" className="view-page-link">
                    🔗 Переглянути сторінку
                  </a>
                )}
                {file.status === 'error' && file.error && (
                  <div className="error-message" title={file.error}>
                    Помилка: {file.error.length > 50 ? file.error.substring(0, 50) + '...' : file.error}
                  </div>
                )}
              </div>
            </div>
            <button 
              className="remove-file-btn" 
              onClick={() => onRemoveFile(file.id)}
              title="Видалити файл зі списку"
              disabled={isInProgress}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilesList;
