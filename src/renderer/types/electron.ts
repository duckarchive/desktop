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
}
