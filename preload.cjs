const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes a safe, whitelisted subset of Electron/Node.js APIs to the renderer
 * process via contextBridge. The renderer can access these as window.electronAPI.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /** Read a file from the local file system and return its text content. */
  readFile: (filePath) => ipcRenderer.invoke('electron:readFile', filePath),

  /** Write text content to a file on the local file system. */
  writeFile: (filePath, content) => ipcRenderer.invoke('electron:writeFile', filePath, content),

  /** Open a native file-picker dialog and return the selected file path (or null if cancelled). */
  selectFile: (title) => ipcRenderer.invoke('electron:selectFile', title),

  /** Load the persisted todo.txt / archive.txt file paths from the app config. */
  getPaths: () => ipcRenderer.invoke('electron:getPaths'),

  /** Persist the todo.txt / archive.txt file paths to the app config. */
  setPaths: (todoPath, archivePath) => ipcRenderer.invoke('electron:setPaths', todoPath, archivePath),

  /** Show and focus the main application window. */
  showMainWindow: () => ipcRenderer.invoke('electron:showMainWindow'),

  /** Close the desktop widget window. */
  closeWidgetWindow: () => ipcRenderer.invoke('electron:closeWidgetWindow'),

  /** Check for updates (Electron main process autoUpdater). */
  checkForUpdates: () => ipcRenderer.invoke('electron:checkForUpdates'),

  /** Open url in external system browser */
  openExternal: (url) => ipcRenderer.invoke('electron:openExternal', url),

  /** Listen for deep links */
  onDeepLink: (callback) => {
    const subscription = (_event, url) => callback(url);
    ipcRenderer.on('electron:deeplink', subscription);
    return () => ipcRenderer.removeListener('electron:deeplink', subscription);
  },

  /** Listen for update status callbacks. */
  onUpdaterStatus: (callback) => ipcRenderer.on('updater:status', (_event, status, info) => callback(status, info)),

  /** Listen for file changes (Electron main process file watcher). */
  onFileChanged: (callback) => {
    const subscription = (_event, type) => callback(type);
    ipcRenderer.on('electron:file-changed', subscription);
    return () => ipcRenderer.removeListener('electron:file-changed', subscription);
  }
});
