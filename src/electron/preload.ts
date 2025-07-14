import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API interface for type safety
interface ElectronAPI {
  // File operations
  openFile: () => Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
  } | null>;

  // Upload operations
  uploadFile: (filePath: string) => Promise<{
    success: boolean;
    message: string;
    parsed?: any;
    error?: any;
  }>;

  // Progress listener
  onUploadProgress: (callback: (data: { progress: number; message: string }) => void) => void;
  removeUploadProgressListener: () => void;

  // App operations
  quit: () => Promise<void>;
  getVersion: () => Promise<string>;
  getEnvStatus: () => Promise<{
    hasCredentials: boolean;
    username: string;
    envPath: string;
    envExists: boolean;
  }>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  /**
   * Opens a file dialog and returns file information
   */
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  /**
   * Uploads a file to Wikisource
   * @param filePath - Path to the file to upload
   */
  uploadFile: (filePath: string) => ipcRenderer.invoke('upload:file', filePath),

  /**
   * Listen for upload progress updates
   * @param callback - Function to call when progress updates are received
   */
  onUploadProgress: (callback: (data: { progress: number; message: string }) => void) => {
    const wrappedCallback = (_event: IpcRendererEvent, data: { progress: number; message: string }) => {
      callback(data);
    };
    ipcRenderer.on('upload:progress', wrappedCallback);
  },

  /**
   * Remove upload progress listener
   */
  removeUploadProgressListener: () => {
    ipcRenderer.removeAllListeners('upload:progress');
  },

  /**
   * Quit the application
   */
  quit: () => ipcRenderer.invoke('app:quit'),

  /**
   * Get application version
   */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  /**
   * Get environment configuration status
   */
  getEnvStatus: () => ipcRenderer.invoke('app:getEnvStatus'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  } catch (error) {
    console.error('Failed to expose electronAPI:', error);
  }
} else {
  // Fallback for development
  (window as any).electronAPI = electronAPI;
}

// Type declaration for the global electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
