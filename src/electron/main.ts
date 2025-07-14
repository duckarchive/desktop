import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { uploadFileWithProgress } from './uploadService';
import { parseFileName } from '../parse';

// Load environment variables
import * as dotenv from 'dotenv';

// Load .env file from the correct directory
const isDev = process.env.NODE_ENV === 'development';
let envPath: string;

if (isDev) {
  // In development, look in the project root
  envPath = path.join(__dirname, '../../.env');
} else {
  // In production, look next to the executable or in app resources
  const appRoot = path.dirname(app.getAppPath());
  envPath = path.join(appRoot, '.env');
  
  // Fallback to resources directory
  if (!fs.existsSync(envPath)) {
    envPath = path.join(appRoot, 'resources', '.env');
  }
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Environment variables loaded from:', envPath);
} else {
  console.warn('⚠️  .env file not found at:', envPath);
  console.warn('📝 Please create a .env file with your Wikimedia credentials');
}

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

class WikiManagerApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupApp();
    this.setupIpcHandlers();
  }

  private setupApp(): void {
    // Handle app ready event
    app.whenReady().then(() => {
      this.createMainWindow();

      // macOS specific behavior
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    // Handle window close events
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    // Create the main application window
    this.mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 500,
      webPreferences: {
        nodeIntegration: false, // Security best practice
        contextIsolation: true, // Security best practice
        preload: path.join(__dirname, 'preload.js'), // Preload script for secure IPC
      },
      titleBarStyle: 'default',
      show: false, // Don't show until ready
    });

    // Load the renderer HTML
    const rendererPath = path.join(__dirname, '../renderer/index.html');
    this.mainWindow.loadFile(rendererPath);

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Development tools
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupIpcHandlers(): void {
    // Handle file selection dialog
    ipcMain.handle('dialog:openFile', async () => {
      if (!this.mainWindow) return null;

      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const fileSize = fs.statSync(filePath).size;

      return {
        filePath,
        fileName,
        fileSize
      };
    });

    // Handle file upload
    ipcMain.handle('upload:file', async (event: IpcMainInvokeEvent, filePath: string) => {
      try {
        // Validate environment variables first
        if (!process.env.WIKI_BOT_USERNAME || !process.env.WIKI_BOT_PASSWORD) {
          throw new Error(
            'Missing credentials! Please configure WIKI_BOT_USERNAME and WIKI_BOT_PASSWORD in your .env file.\n\n' +
            'Expected .env location: ' + envPath
          );
        }

        // Send progress updates to renderer
        const sendProgress = (progress: number, message: string) => {
          event.sender.send('upload:progress', { progress, message });
        };

        // Parse the filename
        const fileName = path.basename(filePath);
        const parsed = parseFileName(fileName);
        
        if (!parsed) {
          throw new Error('Failed to parse filename. Please ensure the filename follows the required format.');
        }

        sendProgress(10, 'File parsed successfully...');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          throw new Error('File not found');
        }

        sendProgress(20, 'Starting upload...');

        // Perform the upload using enhanced upload service with progress
        await uploadFileWithProgress(filePath, parsed, sendProgress);

        return {
          success: true,
          message: 'File uploaded successfully to Wikisource!',
          parsed
        };

      } catch (error) {
        console.error('Upload failed:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          error: error
        };
      }
    });

    // Handle app quit
    ipcMain.handle('app:quit', () => {
      app.quit();
    });

    // Handle app version
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    // Handle environment status check
    ipcMain.handle('app:getEnvStatus', () => {
      return {
        hasCredentials: !!(process.env.WIKI_BOT_USERNAME && process.env.WIKI_BOT_PASSWORD),
        username: process.env.WIKI_BOT_USERNAME || 'Not configured',
        envPath: envPath,
        envExists: fs.existsSync(envPath)
      };
    });
  }
}

// Initialize the application
new WikiManagerApp();
