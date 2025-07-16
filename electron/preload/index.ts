import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API interface for type safety
export interface ElectronAPI {
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

  // Image to PDF conversion operations
  imageConverter: {
    checkEnvironment: () => Promise<{
      success: boolean;
      pythonAvailable: boolean;
      pythonPath?: string;
      pythonVersion?: string;
      img2pdfAvailable: boolean;
      img2pdfVersion?: string;
      img2pdfExePath?: string;
      isWindows: boolean;
      needsSetup: boolean;
      setupInstructions?: string[];
      error?: string;
    }>;
    installImg2pdf: () => Promise<{
      success: boolean;
      message: string;
    }>;
    setExePath: (exePath: string) => Promise<{
      success: boolean;
      message: string;
    }>;
    convertToPdf: (imagePaths: string[], options?: {
      outputPath?: string;
      rotation?: 'auto' | 0 | 90 | 180 | 270;
    }) => Promise<{
      success: boolean;
      outputPath?: string;
      message: string;
      error?: string;
    }>;
    getSupportedFormats: () => Promise<string[]>;
    validateFiles: (filePaths: string[]) => Promise<{
      valid: boolean;
      unsupportedFiles: string[];
    }>;
    onProgress: (callback: (data: { progress: number; message: string }) => void) => void;
    removeProgressListener: () => void;
  };

  // Additional file dialogs
  openImages: () => Promise<Array<{
    filePath: string;
    fileName: string;
    fileSize: number;
  }>>;
  savePdf: (defaultName?: string) => Promise<string | null>;
  selectImg2pdfExe: () => Promise<string | null>;
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

  /**
   * Opens a file dialog to select image files
   */
  openImages: () => ipcRenderer.invoke('dialog:openImages'),

  /**
   * Opens a file dialog to save a PDF file
   */
  savePdf: (defaultName?: string) => ipcRenderer.invoke('dialog:savePdf', defaultName),

  /**
   * Opens a file dialog to select the img2pdf executable
   */
  selectImg2pdfExe: () => ipcRenderer.invoke('dialog:selectImg2pdfExe'),

  /**
   * Image to PDF conversion functionality
   */
  imageConverter: {
    checkEnvironment: () => ipcRenderer.invoke('imageConverter:checkEnvironment'),

    /**
     * Install img2pdf if not already installed
     */
    installImg2pdf: () => ipcRenderer.invoke('imageConverter:installImg2pdf'),

    /**
     * Set the executable path for img2pdf
     */
    setExePath: (exePath: string) => ipcRenderer.invoke('imageConverter:setExePath', exePath),

    /**
     * Convert images to PDF
     */
    convertToPdf: (imagePaths: string[], options?: {
      outputPath?: string;
      dpi?: number;
      rotation?: 'auto' | 0 | 90 | 180 | 270;
    }) => ipcRenderer.invoke('imageConverter:convertToPdf', imagePaths, options),

    /**
     * Get supported image formats for conversion
     */
    getSupportedFormats: () => ipcRenderer.invoke('imageConverter:getSupportedFormats'),

    /**
     * Validate image files for conversion
     */
    validateFiles: (filePaths: string[]) => ipcRenderer.invoke('imageConverter:validateFiles', filePaths),

    /**
     * Listen for conversion progress updates
     */
    onProgress: (callback: (data: { progress: number; message: string }) => void) => {
      const wrappedCallback = (_event: IpcRendererEvent, data: { progress: number; message: string }) => {
        callback(data);
      };
      ipcRenderer.on('imageConverter:progress', wrappedCallback);
    },

    /**
     * Remove conversion progress listener
     */
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('imageConverter:progress');
    },
  },
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