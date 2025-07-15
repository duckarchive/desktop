interface ProgressContainerProps {
  show: boolean;
  progress: number;
  message: string;
}

const ProgressContainer: React.FC<ProgressContainerProps> = ({
  show,
  progress,
  message,
}) => {
  if (!show) {
    return null;
  }

  return (
    <div className="bg-white bg-opacity-95 rounded-xl p-6 backdrop-blur-md shadow-lg">
      <div className="w-full h-5 bg-gray-200 rounded-full overflow-hidden mb-4 shadow-inner">
        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
        <div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-opacity-30 to-transparent"
            style={{ animation: "shimmer 2s infinite" }}
          />
        </div>
      </div>
      <p className="text-center m-0 text-gray-800 font-medium">{message}</p>
    </div>
  );
};

export default ProgressContainer;
