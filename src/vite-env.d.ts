/// <reference types="vite/client" />

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: import('../electron/preload').ElectronAPI
}
