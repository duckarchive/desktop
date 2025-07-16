import { app, BrowserWindow, shell, ipcMain, dialog, IpcMainInvokeEvent } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import * as fs from 'fs'
import { publishFileWithProgress } from './uploadService'
import { parseFileName } from './parse'
import { CredentialsManager } from './credentialsManager'
import { ConversionOptions, imageConverter } from './imageConverter'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Initialize credentials manager
const credentialsManager = new CredentialsManager()

// Enable live reload for development
if (process.env.NODE_ENV === "development") {
  require("electron-reload")(__dirname, {
    electron: path.join(__dirname, "..", "..", "node_modules", ".bin", "electron"),
    hardResetMethod: "exit",
  });
}

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// Export sourcesOptions for other modules
export const sourcesOptions = {
  apiUrl: "https://uk.wikisource.org/w/api.php",
  username: credentialsManager.getCredentials()?.username,
  password: credentialsManager.getCredentials()?.password,
}

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    title: 'Качиний Помічник',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false, // Security best practice
      contextIsolation: true, // Security best practice
    },
    titleBarStyle: "default",
    show: false, // Don't show until ready
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Show window when ready to prevent visual flash
  win.once("ready-to-show", () => {
    win?.show()
  })

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (
      parsedUrl.origin !== "http://localhost:3000" &&
      parsedUrl.origin !== "file://"
    ) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

// ============ IPC Handlers from __main.ts ============

// Handle file selection dialog
ipcMain.handle("dialog:openFile", async () => {
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [
      { name: "PDF Files", extensions: ["pdf"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  const fileName = path.basename(filePath)
  const fileSize = fs.statSync(filePath).size

  return {
    filePath,
    fileName,
    fileSize,
  }
})

// Handle multiple files selection dialog
ipcMain.handle("dialog:openFiles", async () => {
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { name: "PDF Files", extensions: ["pdf"] },
      { name: "All Files", extensions: ["*"] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  return result.filePaths.map((filePath) => {
    const fileName = path.basename(filePath)
    const fileSize = fs.statSync(filePath).size
    return {
      filePath,
      fileName,
      fileSize,
    }
  })
})

// Handle file upload
ipcMain.handle(
  "upload:file",
  async (event: IpcMainInvokeEvent, filePath: string) => {
    try {
      // Get credentials from secure storage
      const credentials = credentialsManager.getCredentials()

      if (!credentials.username || !credentials.password) {
        throw new Error(
          "Облікові дані відсутні! Будь ласка, налаштуйте Вікімедіа-бота."
        )
      }

      // Send progress updates to renderer
      const sendProgress = (progress: number, message: string) => {
        event.sender.send("upload:progress", { progress, message })
      }

      // Parse the filename
      const fileName = path.basename(filePath)
      const parsed = parseFileName(fileName)

      if (!parsed) {
        throw new Error(
          "Не вдалося проаналізувати назву файлу. Будь ласка, переконайтеся, що назва файлу відповідає необхідному формату."
        )
      }

      sendProgress(10, "Файл успішно проаналізовано...")

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error("Файл не знайдено")
      }

      sendProgress(20, "Початок публікації...")

      // Perform the publish using the complete publishFile logic with progress
      const publishResult = await publishFileWithProgress(
        filePath,
        sendProgress,
        credentials
      )

      return {
        success: true,
        message: "Файл успішно опубліковано на Вікіджерелах!",
        pageUrl: publishResult.casePageUrl,
        parsed,
      }
    } catch (error) {
      console.error("Upload failed:", error)
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        error: error,
      }
    }
  }
)

// Handle app quit
ipcMain.handle("app:quit", () => {
  app.quit()
})

// Handle app version
ipcMain.handle("app:getVersion", () => {
  return app.getVersion()
})

// Handle filename validation
ipcMain.handle(
  "validate:fileName",
  async (event: IpcMainInvokeEvent, fileName: string) => {
    try {
      const parsed = parseFileName(fileName)
      if (parsed) {
        return {
          isValid: true,
          parsed,
        }
      } else {
        return {
          isValid: false,
          error: "Назва файлу не відповідає очікуваному формату",
        }
      }
    } catch (error) {
      return {
        isValid: false,
        error:
          "Помилка аналізу назви файлу: " +
          (error instanceof Error ? error.message : "Невідома помилка"),
      }
    }
  }
)

// Handle environment status check (now credentials status)
ipcMain.handle("app:getCredentialsStatus", () => {
  const storageInfo = credentialsManager.getStorageInfo()
  const hasCredentials = credentialsManager.hasCredentials()
  const credentials = credentialsManager.getCredentials()

  return {
    hasCredentials,
    username: credentials.username,
    storagePath: storageInfo.path,
    encrypted: storageInfo.encrypted,
    lastUpdated: storageInfo.timestamp
      ? new Date(storageInfo.timestamp).toLocaleString()
      : "Never",
  }
})

// Handle credentials save
ipcMain.handle(
  "credentials:save",
  async (
    event,
    { username, password }: { username: string; password: string }
  ) => {
    try {
      const validation = credentialsManager.validateCredentials(
        username,
        password
      )
      if (!validation.valid) {
        return { success: false, message: validation.message }
      }

      const saved = credentialsManager.saveCredentials(username, password)
      return {
        success: saved,
        message: saved
          ? "Облікові дані збережено безпечно!"
          : "Не вдалося зберегти облікові дані",
        warning: validation.message.includes("Warning")
          ? validation.message
          : undefined,
      }
    } catch (error) {
      return {
        success: false,
        message:
          "Помилка збереження облікових даних: " +
          (error instanceof Error ? error.message : "Невідома помилка"),
      }
    }
  }
)

// Handle credentials get
ipcMain.handle("credentials:get", () => {
  try {
    const credentials = credentialsManager.getCredentials()
    return {
      success: true,
      credentials: {
        username: credentials.username,
        // Don't send password for security - only indicate if it exists
        hasPassword: !!credentials.password,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: "Не вдалося завантажити облікові дані",
    }
  }
})

// Handle credentials clear
ipcMain.handle("credentials:clear", () => {
  try {
    const cleared = credentialsManager.clearCredentials()
    return {
      success: cleared,
      message: cleared
        ? "Облікові дані видалено!"
        : "Не вдалося видалити облікові дані",
    }
  } catch (error) {
    return { success: false, message: "Помилка видалення облікових даних" }
  }
})

// ============ Image to PDF Conversion Handlers ============

// Handle image files selection for conversion
ipcMain.handle("dialog:openImages", async () => {
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile", "multiSelections"],
    filters: [
      { 
        name: "Image Files", 
        extensions: [
          "jpg", "jpeg", "png", "tiff", "tif", 
          "bmp", "gif", "webp", "jp2", "j2k",
          "jpf", "jpx", "jpm", "mj2"
        ] 
      },
      { name: "All Files", extensions: ["*"] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return []
  }

  return result.filePaths.map((filePath) => {
    const fileName = path.basename(filePath)
    const fileSize = fs.statSync(filePath).size
    return {
      filePath,
      fileName,
      fileSize,
    }
  })
})

// Handle save PDF dialog
ipcMain.handle("dialog:savePdf", async (_, defaultName?: string) => {
  if (!win) return null

  const result = await dialog.showSaveDialog(win, {
    filters: [
      { name: "PDF Files", extensions: ["pdf"] },
      { name: "All Files", extensions: ["*"] },
    ],
    defaultPath: defaultName || "converted_images.pdf"
  })

  if (result.canceled || !result.filePath) {
    return null
  }

  return result.filePath
})

// Handle img2pdf.exe file selection (Windows)
ipcMain.handle("dialog:selectImg2pdfExe", async () => {
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    properties: ["openFile"],
    filters: [
      { name: "img2pdf Executable", extensions: ["exe"] },
      { name: "All Files", extensions: ["*"] },
    ],
    title: "Select img2pdf.exe"
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

// Check environment following the plan
ipcMain.handle("imageConverter:checkEnvironment", async () => {
  try {
    const status = await imageConverter.checkEnvironment()
    return {
      success: true,
      ...status
    }
  } catch (error) {
    return {
      success: false,
      pythonAvailable: false,
      img2pdfAvailable: false,
      isWindows: process.platform === 'win32',
      needsSetup: true,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
})

// Install img2pdf package (Step 1.1.2)
ipcMain.handle("imageConverter:installImg2pdf", async () => {
  try {
    const result = await imageConverter.installImg2pdf()
    return result
  } catch (error) {
    return {
      success: false,
      message: `Installation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
})

// Set img2pdf.exe path for Windows (Step 1.2.1)
ipcMain.handle("imageConverter:setExePath", async (_, exePath: string) => {
  try {
    const result = await imageConverter.setImg2pdfExePath(exePath)
    return result
  } catch (error) {
    return {
      success: false,
      message: `Failed to set exe path: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
})

// Convert images to PDF
ipcMain.handle("imageConverter:convertToPdf", async (
  event: IpcMainInvokeEvent, 
  imagePaths: string[], 
  options: ConversionOptions = {}
) => {
  try {
    // Validate image files
    const validation = imageConverter.validateImageFiles(imagePaths)
    if (!validation.valid) {
      return {
        success: false,
        message: `Unsupported file formats detected: ${validation.unsupportedFiles.join(', ')}`,
        error: 'UNSUPPORTED_FORMAT'
      }
    }

    // Send progress update
    event.sender.send("imageConverter:progress", { 
      progress: 10, 
      message: "Starting conversion..." 
    })

    const result = await imageConverter.convertImagesToPdf(imagePaths, options)
    
    if (result.success) {
      event.sender.send("imageConverter:progress", { 
        progress: 100, 
        message: "Conversion completed!" 
      })
    }

    return result
  } catch (error) {
    return {
      success: false,
      message: `Conversion failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
})

// Get supported image formats
ipcMain.handle("imageConverter:getSupportedFormats", () => {
  return imageConverter.getSupportedFormats()
})

// Validate image files
ipcMain.handle("imageConverter:validateFiles", (_, filePaths: string[]) => {
  return imageConverter.validateImageFiles(filePaths)
})
