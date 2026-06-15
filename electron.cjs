const { app, BrowserWindow, Menu, ipcMain, dialog, Tray, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let widgetWindow = null;
let tray = null;
let isQuitting = false;


// ---------------------------------------------------------------------------
// Persistent config: store file paths in %AppData%/Todo.txt/
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

ipcMain.handle('electron:showMainWindow', async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle('electron:closeWidgetWindow', async () => {
  if (widgetWindow) {
    widgetWindow.close();
  }
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
    title: 'Todo.txt',
  });

  // Check if we are in development mode
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createWidgetWindow() {
  if (widgetWindow) {
    widgetWindow.focus();
    return;
  }

  let widgetConfig = { x: undefined, y: undefined, width: 340, height: 480 };
  const configPath = path.join(app.getPath('userData'), 'widget-config.json');
  try {
    if (fs.existsSync(configPath)) {
      widgetConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load widget-config.json', e);
  }

  widgetWindow = new BrowserWindow({
    width: widgetConfig.width || 340,
    height: widgetConfig.height || 480,
    x: widgetConfig.x,
    y: widgetConfig.y,
    frame: false,
    transparent: true,
    resizable: true,
    skipTaskbar: true,
    alwaysOnBottom: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, 'public', 'icon.png'),
    title: 'Todo.txt Widget',
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    widgetWindow.loadURL('http://localhost:5173/?view=widget');
  } else {
    widgetWindow.loadFile(path.join(__dirname, 'dist', 'index.html'), { query: { view: 'widget' } });
  }

  widgetWindow.on('move', () => {
    const bounds = widgetWindow.getBounds();
    try {
      fs.writeFileSync(configPath, JSON.stringify({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save widget position', e);
    }
  });

  widgetWindow.on('resize', () => {
    const bounds = widgetWindow.getBounds();
    try {
      fs.writeFileSync(configPath, JSON.stringify({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save widget size', e);
    }
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
  });
}

function showTrayWindow(bounds) {
  if (!mainWindow) return;

  const trayBounds = bounds || (tray ? tray.getBounds() : null);
  const display = trayBounds
    ? screen.getDisplayMatching(trayBounds)
    : screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight, x: displayX, y: displayY } = display.workArea;

  const winWidth = 380;
  const winHeight = 700;

  // Default to bottom-right placement
  let x = displayX + screenWidth - winWidth - 10;
  let y = displayY + screenHeight - winHeight - 10;

  if (trayBounds) {
    // If the tray is at the bottom half of the screen
    if (trayBounds.y > displayY + screenHeight / 2) {
      x = Math.max(displayX + 10, Math.min(displayX + screenWidth - winWidth - 10, trayBounds.x + (trayBounds.width / 2) - (winWidth / 2)));
      y = trayBounds.y - winHeight - 5;
    }
    // If the tray is at the top half of the screen
    else {
      x = Math.max(displayX + 10, Math.min(displayX + screenWidth - winWidth - 10, trayBounds.x + (trayBounds.width / 2) - (winWidth / 2)));
      y = trayBounds.y + trayBounds.height + 5;
    }
  }

  mainWindow.setSize(winWidth, winHeight);
  mainWindow.setPosition(Math.round(x), Math.round(y));
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  const iconPath = path.join(__dirname, 'public', 'icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Todo.txt');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hauptfenster anzeigen',
      click: () => {
        if (!mainWindow) {
          createWindow();
        }
        mainWindow.setSize(1200, 800);
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Mobilansicht anzeigen',
      click: (event) => {
        if (!mainWindow) {
          createWindow();
        }
        showTrayWindow();
      }
    },
    {
      label: 'Desktop-Widget anzeigen',
      click: () => {
        createWidgetWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Beenden',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', (event, bounds) => {
    if (!mainWindow) {
      createWindow();
      showTrayWindow(bounds);
    } else if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showTrayWindow(bounds);
    }
  });
}

app.on('ready', () => {
  createWindow();
  createTray();

  // Auto-Update Events & Check
  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update verfügbar',
      message: `Eine neue Version (${info.version}) wurde heruntergeladen und wird beim nächsten Start installiert.`,
      buttons: ['Jetzt neu starten', 'Später']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.error('Fehler beim Suchen nach Updates:', err);
      });
    }, 3000);
  }

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

app.on('before-quit', () => {
  isQuitting = true;
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
