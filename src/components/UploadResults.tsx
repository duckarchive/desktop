
interface UploadResultsProps {
  show: boolean;
  results: UploadResult[];
}

const UploadResults: React.FC<UploadResultsProps> = ({ show, results }) => {
  if (!show || results.length === 0) {
    return null;
  }

  return (
    <div id="upload-results">
      <h3>Результати публікації</h3>
      <div className="results-container">
        {results.map((result, index) => (
          <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
            <span className="result-icon">{result.success ? '✅' : '❌'}</span>
            <div className="result-details">
              <div className="result-filename">{result.fileName}</div>
              {result.success && result.pageUrl && (
                <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="result-link">
                  🔗 Переглянути сторінку
                </a>
              )}
              {result.success && result.message && (
                <div className="result-message">{result.message}</div>
              )}
              {!result.success && result.error && (
                <div className="result-error">Помилка: {result.error}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadResults;
