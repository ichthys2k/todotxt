const { app, BrowserWindow, Menu, ipcMain, dialog, Tray, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const security = require('./electron-security.cjs');

// Register custom protocol client
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('todotxt', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('todotxt');
}

let mainWindow;
let widgetWindow = null;
let tray = null;
let isQuitting = false;
let deepLinkUrl = null;

// Einziger Instanz-Lock (Single Instance Lock)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Wenn eine zweite Instanz gestartet wird, holen wir das Hauptfenster in den Vordergrund
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    
    // Find deep link in arguments
    const url = commandLine.find(arg => arg.startsWith('todotxt://'));
    if (url) {
      if (mainWindow) {
        mainWindow.webContents.send('electron:deeplink', url);
      } else {
        deepLinkUrl = url;
      }
    }
  });
}

// Support macOS deep linking
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('electron:deeplink', url);
  } else {
    deepLinkUrl = url;
  }
});



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

// Pfade, die der Nutzer in dieser Sitzung im Auswahldialog gewählt hat. Nur sie (oder die bereits
// gespeicherten Pfade) dürfen später als todo.txt/archive.txt eingetragen werden.
const approvedSelections = new Set();

/** Nur die eigenen Hauptframes von Hauptfenster und Widget dürfen die privilegierten Kanäle nutzen. */
function assertTrustedSender(event) {
  const wc = event.sender;
  const isOwnWindow =
    (mainWindow && !mainWindow.isDestroyed() && wc === mainWindow.webContents) ||
    (widgetWindow && !widgetWindow.isDestroyed() && wc === widgetWindow.webContents);
  if (!isOwnWindow || event.senderFrame !== wc.mainFrame) {
    throw new Error('Zugriff verweigert: unbekannter Absender.');
  }
}

/** Datei-Zugriff nur auf die gespeicherten Pfade (todo.txt / archive.txt). */
function assertAllowedFile(filePath) {
  const paths = loadPaths();
  if (!security.isAllowedFile(filePath, [paths.todo, paths.archive])) {
    throw new Error('Zugriff verweigert: Diese Datei ist nicht als todo.txt/archive.txt verknüpft.');
  }
}

ipcMain.handle('electron:readFile', async (event, filePath) => {
  assertTrustedSender(event);
  assertAllowedFile(filePath);
  if (fs.statSync(filePath).size > security.MAX_FILE_BYTES) {
    throw new Error('Datei ist zu groß.');
  }
  return fs.readFileSync(filePath, 'utf8');
});

ipcMain.handle('electron:writeFile', async (event, filePath, content) => {
  assertTrustedSender(event);
  assertAllowedFile(filePath);
  if (typeof content !== 'string' || Buffer.byteLength(content, 'utf8') > security.MAX_FILE_BYTES) {
    throw new Error('Ungültiger oder zu großer Inhalt.');
  }
  fs.writeFileSync(filePath, content, 'utf8');
});

ipcMain.handle('electron:selectFile', async (event, title) => {
  assertTrustedSender(event);
  const result = await dialog.showOpenDialog(mainWindow, {
    title: typeof title === 'string' ? title.slice(0, 200) : 'Datei auswählen',
    filters: [{ name: 'Text-Dateien', extensions: ['txt'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const selected = result.filePaths[0];
  approvedSelections.add(security.comparablePath(selected));
  return selected;
});

let todoWatcher = null;
let archiveWatcher = null;

function updateWatchers() {
  const paths = loadPaths();
  
  if (todoWatcher) {
    todoWatcher.close();
    todoWatcher = null;
  }
  if (archiveWatcher) {
    archiveWatcher.close();
    archiveWatcher = null;
  }

  if (paths.todo && fs.existsSync(paths.todo)) {
    try {
      todoWatcher = fs.watch(paths.todo, (eventType) => {
        if (eventType === 'change') {
          sendChangeNotification('todo');
        }
      });
      todoWatcher.on('error', (err) => {
        console.error('Todo watcher error:', err);
      });
    } catch (e) {
      console.error('Error starting todo watcher:', e);
    }
  }

  if (paths.archive && fs.existsSync(paths.archive)) {
    try {
      archiveWatcher = fs.watch(paths.archive, (eventType) => {
        if (eventType === 'change') {
          sendChangeNotification('archive');
        }
      });
      archiveWatcher.on('error', (err) => {
        console.error('Archive watcher error:', err);
      });
    } catch (e) {
      console.error('Error starting archive watcher:', e);
    }
  }
}

function sendChangeNotification(type) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('electron:file-changed', type);
  }
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.webContents.send('electron:file-changed', type);
  }
}

ipcMain.handle('electron:getPaths', async () => {
  return loadPaths();
});

ipcMain.handle('electron:setPaths', async (event, todoPath, archivePath) => {
  assertTrustedSender(event);
  const current = loadPaths();
  // null = Verknüpfung entfernen. Sonst muss der Pfad bereits gespeichert sein oder gerade
  // über den Auswahldialog gewählt worden sein – die Oberfläche kann ihn nicht frei erfinden.
  const accept = (candidate, existing) => {
    if (candidate === null || candidate === undefined) return null;
    if (typeof candidate !== 'string') throw new Error('Ungültiger Pfad.');
    if (security.samePath(candidate, existing) || approvedSelections.has(security.comparablePath(candidate))) {
      return candidate;
    }
    throw new Error('Zugriff verweigert: Der Pfad wurde nicht über den Auswahldialog gewählt.');
  };
  savePaths({ todo: accept(todoPath, current.todo), archive: accept(archivePath, current.archive) });
  updateWatchers();
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

ipcMain.handle('electron:checkForUpdates', async () => {
  if (!app.isPackaged) {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'dev');
    }
    return { status: 'dev' };
  }
  try {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'checking');
    }
    await autoUpdater.checkForUpdates();
    return { status: 'checking' };
  } catch (err) {
    console.error('Update check error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'error', err.message);
    }
    return { status: 'error', error: err.message };
  }
});

ipcMain.handle('electron:openExternal', async (event, url) => {
  assertTrustedSender(event);
  if (!security.isSafeExternalUrl(url)) {
    throw new Error('Zugriff verweigert: Nur https-, http- und mailto-Links dürfen geöffnet werden.');
  }
  await shell.openExternal(url);
});

// ---------------------------------------------------------------------------
// Fenster-Härtung: keine fremden Fenster, keine Navigation weg von der App, keine <webview>
// ---------------------------------------------------------------------------

app.on('web-contents-created', (_event, contents) => {
  // Links mit target="_blank" und window.open(): nie als neues Electron-Fenster, sondern im Systembrowser
  contents.setWindowOpenHandler(({ url }) => {
    if (security.isSafeExternalUrl(url)) {
      shell.openExternal(url).catch((err) => console.error('openExternal failed:', err));
    }
    return { action: 'deny' };
  });

  // Normale Links ohne target: die App-Seite darf nicht durch eine fremde Seite ersetzt werden
  contents.on('will-navigate', (event, url) => {
    if (!security.isAllowedNavigation(url, contents.getURL())) {
      event.preventDefault();
      if (security.isSafeExternalUrl(url)) {
        shell.openExternal(url).catch((err) => console.error('openExternal failed:', err));
      }
    }
  });

  contents.on('will-attach-webview', (event) => event.preventDefault());
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
      sandbox: true,                               // Preload nutzt nur 'electron' (contextBridge/ipcRenderer)
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

  // Forward deep link when loaded
  mainWindow.webContents.on('did-finish-load', () => {
    if (deepLinkUrl) {
      mainWindow.webContents.send('electron:deeplink', deepLinkUrl);
      deepLinkUrl = null;
    }
  });

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
      sandbox: true,
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
  updateWatchers();

  // Auto-Update Events & Check
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'available', info.version);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'not-available');
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'error', err.message);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:status', 'downloaded', info.version);
    }
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
