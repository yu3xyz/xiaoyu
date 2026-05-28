const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let isQuitting = false;
let petPosition = { x: 100, y: 100 };
const configPath = path.join(app.getPath('userData'), 'config.json');
const positionPath = path.join(app.getPath('userData'), 'position.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    petName: '小雨'
  };
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function loadPosition() {
  try {
    if (fs.existsSync(positionPath)) {
      return JSON.parse(fs.readFileSync(positionPath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  return { x: width - 320, y: 100 };
}

function savePosition(pos) {
  fs.writeFileSync(positionPath, JSON.stringify(pos, null, 2), 'utf8');
}

function createWindow() {
  const pos = loadPosition();
  petPosition = pos;

  mainWindow = new BrowserWindow({
    x: pos.x,
    y: pos.y,
    width: 300,
    height: 450,
    transparent: true,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('move', () => {
    const bounds = mainWindow.getBounds();
    petPosition = { x: bounds.x, y: bounds.y };
    savePosition(petPosition);
  });
}

function createTray() {
  const iconSize = 16;
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开设置',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: '隐藏/显示',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('小雨 - 桌面宠物');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

app.whenReady().then(() => {
  app.commandLine.appendSwitch('enable-transparent-visuals');

  createWindow();
  createTray();

  ipcMain.handle('get-config', () => {
    const cfg = loadConfig();
    // Use env var as fallback if no saved key
    if (!cfg.apiKey && process.env.XIAOYU_API_KEY) {
      cfg.apiKey = process.env.XIAOYU_API_KEY;
    }
    return cfg;
  });
  ipcMain.handle('save-config', (event, config) => {
    saveConfig(config);
    return true;
  });
  ipcMain.handle('get-position', () => loadPosition());
  ipcMain.handle('save-position', (event, pos) => {
    petPosition = pos;
    savePosition(pos);
    return true;
  });
  ipcMain.handle('set-ignore-mouse-events', (event, ignore) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });
  ipcMain.on('window-drag', (event, delta) => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds();
      const newX = bounds.x + delta.x;
      const newY = bounds.y + delta.y;
      mainWindow.setBounds({ x: newX, y: newY });
      petPosition = { x: newX, y: newY };
      savePosition(petPosition);
    }
  });
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

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  if (mainWindow) {
    const bounds = mainWindow.getBounds();
    savePosition({ x: bounds.x, y: bounds.y });
  }
});
