import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API interface for type safety
interface ElectronAPI {
  // File operations
  openFile: () => Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
  } | null>;

  openFiles: () => Promise<Array<{
    filePath: string;
    fileName: string;
    fileSize: number;
  }>>;

  // Upload operations
  uploadFile: (filePath: string) => Promise<{
    success: boolean;
    message: string;
    pageUrl?: string;
    parsed?: any;
    error?: any;
  }>;

  // Progress listener
  onUploadProgress: (callback: (data: { progress: number; message: string }) => void) => void;
  removeUploadProgressListener: () => void;

  // Credentials operations
  saveCredentials: (username: string, password: string) => Promise<{
    success: boolean;
    message: string;
    warning?: string;
  }>;
  getCredentials: () => Promise<{
    success: boolean;
    credentials?: {
      username: string;
      hasPassword: boolean;
    };
    message?: string;
  }>;
  clearCredentials: () => Promise<{
    success: boolean;
    message: string;
  }>;

  // App operations
  quit: () => Promise<void>;
  getVersion: () => Promise<string>;
  getCredentialsStatus: () => Promise<{
    hasCredentials: boolean;
    username: string;
    storagePath: string;
    encrypted: boolean;
    lastUpdated: string;
  }>;

  // Validation operations
  validateFileName: (fileName: string) => Promise<{
    isValid: boolean;
    parsed?: any;
    error?: string;
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
   * Opens a file dialog and returns multiple file information
   */
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),

  /**
   * Uploads a file to Wikisource
   * @param filePath - Path to the file to upload
   */
  uploadFile: (filePath: string) => ipcRenderer.invoke('upload:file', filePath),

  /**
   * Save credentials securely
   */
  saveCredentials: (username: string, password: string) => 
    ipcRenderer.invoke('credentials:save', { username, password }),

  /**
   * Get stored credentials (username only, password existence indicator)
   */
  getCredentials: () => ipcRenderer.invoke('credentials:get'),

  /**
   * Clear stored credentials
   */
  clearCredentials: () => ipcRenderer.invoke('credentials:clear'),

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
   * Get credentials configuration status
   */
  getCredentialsStatus: () => ipcRenderer.invoke('app:getCredentialsStatus'),

  /**
   * Validate the file name format and availability
   * @param fileName - The name of the file to validate
   */
  validateFileName: (fileName: string) => ipcRenderer.invoke('validate:fileName', fileName),
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
