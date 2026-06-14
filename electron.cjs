const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// ---------------------------------------------------------------------------
// Persistent config: store file paths in %AppData%/Todo.txt Web App/
// ---------------------------------------------------------------------------

function getConfigPath() {
  return path.join(app.getPath('userData'), 'file-paths.json');
}

function loadPaths() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load file-paths.json:', e);
  }
  return { todo: null, archive: null };
}

function savePaths(paths) {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify(paths, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save file-paths.json:', e);
  }
}

// ---------------------------------------------------------------------------
// IPC handlers (called from renderer via window.electronAPI)
// ---------------------------------------------------------------------------

ipcMain.handle('electron:readFile', async (_event, filePath) => {
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('electron:writeFile', async (_event, filePath, content) => {
  fs.writeFileSync(filePath, content, 'utf8');
});

ipcMain.handle('electron:selectFile', async (_event, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: title || 'Datei auswählen',
    filters: [{ name: 'Text-Dateien', extensions: ['txt'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('electron:getPaths', async () => {
  return loadPaths();
});

ipcMain.handle('electron:setPaths', async (_event, todoPath, archivePath) => {
  savePaths({ todo: todoPath, archive: archivePath });
});

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,                              // must be false for preload require()
      preload: path.join(__dirname, 'preload.cjs'), // contextBridge → window.electronAPI
    },
    title: 'Todo.txt Web App',
  });

  // Check if we are in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();

  // Application menu
  const template = [
    {
      label: 'Datei',
      submenu: [
        { label: 'Beenden', role: 'quit' }
      ]
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { label: 'Rückgängig', role: 'undo' },
        { label: 'Wiederholen', role: 'redo' },
        { type: 'separator' },
        { label: 'Ausschneiden', role: 'cut' },
        { label: 'Kopieren', role: 'copy' },
        { label: 'Einfügen', role: 'paste' },
        { label: 'Alles auswählen', role: 'selectAll' }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        { label: 'Neu laden', role: 'reload' },
        { label: 'Entwicklerwerkzeuge', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom zurücksetzen', role: 'resetZoom' },
        { label: 'Vergrößern', role: 'zoomIn' },
        { label: 'Verkleinern', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Vollbild', role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
