import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { publishFileWithProgress } from './uploadService';
import { parseFileName } from '../parse';
import { CredentialsManager } from './credentialsManager';

// Initialize credentials manager
const credentialsManager = new CredentialsManager();

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

    // Handle multiple files selection dialog
    ipcMain.handle('dialog:openFiles', async () => {
      if (!this.mainWindow) return null;

      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return [];
      }

      return result.filePaths.map(filePath => {
        const fileName = path.basename(filePath);
        const fileSize = fs.statSync(filePath).size;
        return {
          filePath,
          fileName,
          fileSize
        };
      });
    });

    // Handle file upload
    ipcMain.handle('upload:file', async (event: IpcMainInvokeEvent, filePath: string) => {
      try {
        // Get credentials from secure storage
        const credentials = credentialsManager.getCredentials();
        
        if (!credentials.username || !credentials.password) {
          throw new Error(
            'Облікові дані відсутні! Будь ласка, налаштуйте свої облікові дані Вікімедіа-бота в налаштуваннях програми.'
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
          throw new Error('Не вдалося проаналізувати назву файлу. Будь ласка, переконайтеся, що назва файлу відповідає необхідному формату.');
        }

        sendProgress(10, 'Файл успішно проаналізовано...');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          throw new Error('Файл не знайдено');
        }

        sendProgress(20, 'Початок публікації...');

        // Perform the publish using the complete publishFile logic with progress
        const publishResult = await publishFileWithProgress(filePath, sendProgress, credentials);

        return {
          success: true,
          message: 'Файл успішно опубліковано на Вікіджерелах!',
          pageUrl: publishResult.casePageUrl,
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

    // Handle filename validation
    ipcMain.handle('validate:fileName', async (event: IpcMainInvokeEvent, fileName: string) => {
      try {
        const parsed = parseFileName(fileName);
        if (parsed) {
          return {
            isValid: true,
            parsed
          };
        } else {
          return {
            isValid: false,
            error: 'Назва файлу не відповідає очікуваному формату'
          };
        }
      } catch (error) {
        return {
          isValid: false,
          error: 'Помилка аналізу назви файлу: ' + (error instanceof Error ? error.message : 'Невідома помилка')
        };
      }
    });

    // Handle environment status check (now credentials status)
    ipcMain.handle('app:getCredentialsStatus', () => {
      const storageInfo = credentialsManager.getStorageInfo();
      const hasCredentials = credentialsManager.hasCredentials();
      const credentials = credentialsManager.getCredentials();
      
      return {
        hasCredentials,
        username: hasCredentials ? credentials.username : 'Not configured',
        storagePath: storageInfo.path,
        encrypted: storageInfo.encrypted,
        lastUpdated: storageInfo.timestamp ? new Date(storageInfo.timestamp).toLocaleString() : 'Never'
      };
    });

    // Handle credentials save
    ipcMain.handle('credentials:save', async (event, { username, password }: { username: string; password: string }) => {
      try {
        const validation = credentialsManager.validateCredentials(username, password);
        if (!validation.valid) {
          return { success: false, message: validation.message };
        }

        const saved = credentialsManager.saveCredentials(username, password);
        return { 
          success: saved, 
          message: saved ? 'Облікові дані збережено безпечно!' : 'Не вдалося зберегти облікові дані',
          warning: validation.message.includes('Warning') ? validation.message : undefined
        };
      } catch (error) {
        return { 
          success: false, 
          message: 'Помилка збереження облікових даних: ' + (error instanceof Error ? error.message : 'Невідома помилка')
        };
      }
    });

    // Handle credentials get
    ipcMain.handle('credentials:get', () => {
      try {
        const credentials = credentialsManager.getCredentials();
        return {
          success: true,
          credentials: {
            username: credentials.username,
            // Don't send password for security - only indicate if it exists
            hasPassword: !!credentials.password
          }
        };
      } catch (error) {
        return { success: false, message: 'Не вдалося завантажити облікові дані' };
      }
    });

    // Handle credentials clear
    ipcMain.handle('credentials:clear', () => {
      try {
        const cleared = credentialsManager.clearCredentials();
        return { success: cleared, message: cleared ? 'Облікові дані видалено!' : 'Не вдалося видалити облікові дані' };
      } catch (error) {
        return { success: false, message: 'Помилка видалення облікових даних' };
      }
    });
  }
}

// Initialize the application
new WikiManagerApp();
