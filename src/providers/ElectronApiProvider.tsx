import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToastHelpers } from '@/providers/ToastProvider';

type ElectronAPI = typeof window.electronAPI;

const ElectronApiContext = createContext<ElectronAPI | null>(null);

export const useElectronApi = () => {
  const context = useContext(ElectronApiContext);
  if (!context) {
    throw new Error('useElectronApi must be used within an ElectronApiProvider');
  }
  return context;
};

interface ElectronApiProviderProps {
  children: ReactNode;
}

export const ElectronApiProvider: React.FC<ElectronApiProviderProps> = ({ children }) => {
  const { showError } = useToastHelpers();
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    if (!window.electronAPI) {
      showError("Electron API недоступне");
      setApi(null);
    } else {
      setApi(window.electronAPI);
    }
  }, []);

  if (!api) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="">Electron API недоступне</p>
      </div>
    );
  }

  return (
    <ElectronApiContext.Provider value={api}>
      {children}
    </ElectronApiContext.Provider>
  );
};