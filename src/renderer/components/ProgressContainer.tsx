import React from 'react';

interface ProgressContainerProps {
  show: boolean;
  progress: number;
  message: string;
}

const ProgressContainer: React.FC<ProgressContainerProps> = ({ show, progress, message }) => {
  if (!show) {
    return null;
  }

  return (
    <div id="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      <p id="progress-text">{message}</p>
    </div>
  );
};

export default ProgressContainer;
