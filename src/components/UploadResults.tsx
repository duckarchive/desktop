import Button from "@/components/Button";

interface UploadResultsProps {
  show: boolean;
  results: UploadResult[];
  onClose: () => void;
}

const UploadResults: React.FC<UploadResultsProps> = ({ show, results, onClose }) => {
  if (!show || results.length === 0) {
    return null;
  }

  return (
    <div className="bg-white bg-opacity-95 rounded-xl p-4 my-8 backdrop-blur-md shadow-lg">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-100">Результати публікації</h3>
      <div className="max-h-80 overflow-y-auto">
        {results.map((result, index) => (
          <div key={index} className={`flex items-center p-4 rounded-lg mb-2 transition-all ${result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
            <span className="text-xl mr-4 flex-shrink-0">{result.success ? '✅' : '❌'}</span>
            <div className="flex-1">
              <div className="font-medium mb-2 text-gray-800">{result.fileName}</div>
              {result.success && result.pageUrl && (
                <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm inline-block my-1">
                  🔗 Переглянути сторінку
                </a>
              )}
              {result.success && result.message && (
                <div className="text-green-700 text-sm my-1">{result.message}</div>
              )}
              {!result.success && result.error && (
                <div className="text-red-700 text-sm my-1">Помилка: {result.error}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="primary"
        size="small"
        className="mt-4"
        onClick={onClose}
      >
        Завантажити ще файли
      </Button>
    </div>
  );
};

export default UploadResults;
