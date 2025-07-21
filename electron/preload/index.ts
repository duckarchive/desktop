import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ConversionOptions } from '~/main/imageConverter';

// Define the API interface for type safety
export interface ElectronAPI {
  // File operations
  openFile: () => Promise<{
    filePath: string;
    fileName: string;
    fileSize: number;
  } | null>;

  openPDFs: () => Promise<Array<{
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
  saveCredentials: ({ username, password }: WikiCredentials) => Promise<{
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
    convertToPdf: (imagePaths: string[], options?: ConversionOptions) => Promise<{
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

  // PDF to Images converter
  pdfConverter: {
    /**
     * Convert PDF to images
     */
    convertToImages: (pdfPath: string, options?: {
      format?: 'png' | 'jpeg';
      quality?: number;
      density?: number;
      outputDir?: string;
    }) => Promise<{
      success: boolean;
      outputPaths?: string[];
      message: string;
      error?: string;
    }>;

    /**
     * Get PDF page count
     */
    getPageCount: (pdfPath: string) => Promise<{
      success: boolean;
      pageCount?: number;
      message: string;
      error?: string;
    }>;

    /**
     * Listen for conversion progress updates
     */
    onProgress: (callback: (data: { progress: number; message: string }) => void) => void;

    /**
     * Remove conversion progress listener
     */
    removeProgressListener: () => void;
  },
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
  openPDFs: () => ipcRenderer.invoke('dialog:openPDFs'),

  /**
   * Uploads a file to Wikisource
   * @param filePath - Path to the file to upload
   */
  uploadFile: (filePath: string) => ipcRenderer.invoke('upload:file', filePath),

  /**
   * Save credentials securely
   */
  saveCredentials: ({ username, password }: WikiCredentials) => 
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
    convertToPdf: (imagePaths: string[], options?: ConversionOptions) => ipcRenderer.invoke('imageConverter:convertToPdf', imagePaths, options),

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

  /**
   * PDF to Images converter
   */
  pdfConverter: {
    /**
     * Convert PDF to images
     */
    convertToImages: (pdfPath: string, options?: {
      format?: 'png' | 'jpeg';
      quality?: number;
      density?: number;
      outputDir?: string;
    }) => ipcRenderer.invoke('pdf:convert', pdfPath, options),

    /**
     * Get PDF page count
     */
    getPageCount: (pdfPath: string) => ipcRenderer.invoke('pdf:getPageCount', pdfPath),

    /**
     * Listen for conversion progress updates
     */
    onProgress: (callback: (data: { progress: number; message: string }) => void) => {
      const wrappedCallback = (_event: IpcRendererEvent, data: { progress: number; message: string }) => {
        callback(data);
      };
      ipcRenderer.on('pdf:progress', wrappedCallback);
    },

    /**
     * Remove conversion progress listener
     */
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('pdf:progress');
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