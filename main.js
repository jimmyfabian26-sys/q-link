// main.js
// Proceso principal de Electron para Q-Link
// Maneja la ventana de la app, el menu, dialogos de archivo y el historial persistente

const { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage, clipboard, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.argv.includes('--dev');
const OFFICIAL_EXTERNAL_LINKS = Object.freeze({
  portfolio: 'https://jimmydiaz-portfolio.vercel.app',
  github: 'https://github.com/jimmyfabian26-sys'
});

// ---------- Almacenamiento simple basado en archivos JSON (userData) ----------
// Se evita una dependencia externa pesada y se replica el comportamiento de
// electron-store con un wrapper propio, mas predecible para production-ready.
class JsonStore {
  constructor(fileName, defaults = {}) {
    this.filePath = path.join(app.getPath('userData'), fileName);
    this.defaults = defaults;
    this._ensureFile();
  }

  _ensureFile() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify(this.defaults, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('[JsonStore] Error asegurando el archivo:', err);
    }
  }

  readAll() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('[JsonStore] Error leyendo store, usando valores por defecto:', err);
      return { ...this.defaults };
    }
  }

  writeAll(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[JsonStore] Error escribiendo store:', err);
      return false;
    }
  }

  get(key, fallback) {
    const data = this.readAll();
    return key in data ? data[key] : fallback;
  }

  set(key, value) {
    const data = this.readAll();
    data[key] = value;
    return this.writeAll(data);
  }
}

let mainWindow = null;
let configStore = null;
let historyStore = null;
let presetsStore = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 850,
    minWidth: 360,
    minHeight: 560,
    backgroundColor: '#121212',
    icon: path.join(__dirname, 'src/assets/icons/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));

  // No se permite navegar a contenido remoto ni abrir ventanas desde el renderer.
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());


  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  // Identidad de la app en la barra de tareas de Windows (equivalente al
  // ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID de Python)
  if (process.platform === 'win32') {
    app.setAppUserModelId('JimmyDiaz.Q-link.Qr.1.0');
  }

  configStore = new JsonStore('config.json', {
    lastSavePath: app.getPath('documents'),
    themeMode: 'dark'
  });

  historyStore = new JsonStore('history.json', { items: [] });

  presetsStore = new JsonStore('user-presets.json', { presets: [] });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Todos los canales comprueban el emisor y el frame principal.
function handleIpc(channel, handler) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!mainWindow || event.sender !== mainWindow.webContents ||
        event.senderFrame !== mainWindow.webContents.mainFrame) {
      throw new Error('Origen IPC no autorizado.');
    }
    return handler(event, ...args);
  });
}

// Abrir únicamente destinos oficiales, nunca una URL libre del renderer.
handleIpc('external:open', (_evt, target) => {
  if (typeof target !== 'string' || !Object.hasOwn(OFFICIAL_EXTERNAL_LINKS, target)) {
    throw new Error('Enlace externo no autorizado.');
  }
  return shell.openExternal(OFFICIAL_EXTERNAL_LINKS[target]);
});

// =================== IPC: Configuracion ===================
handleIpc('config:get', (_evt, key) => configStore.get(key));
handleIpc('config:set', (_evt, key, value) => configStore.set(key, value));

// =================== IPC: Historial ===================
handleIpc('history:getAll', () => {
  const data = historyStore.readAll();
  return data.items || [];
});

handleIpc('history:add', (_evt, entry) => {
  const data = historyStore.readAll();
  const items = data.items || [];
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...entry
  };
  items.unshift(newEntry);
  // Limitar historial a 200 entradas para no inflar el archivo indefinidamente
  data.items = items.slice(0, 200);
  historyStore.writeAll(data);
  return newEntry;
});

handleIpc('history:remove', (_evt, id) => {
  const data = historyStore.readAll();
  data.items = (data.items || []).filter((it) => it.id !== id);
  historyStore.writeAll(data);
  return data.items;
});

handleIpc('history:clear', () => {
  historyStore.writeAll({ items: [] });
  return [];
});

// =================== IPC: Presets predefinidos (solo lectura) ===================
handleIpc('presets:getDefaults', () => {
  try {
    const filePath = path.join(__dirname, 'src/assets/presets/presets.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[presets:getDefaults] Error:', err);
    return [];
  }
});

// =================== IPC: Presets personalizados ===================
handleIpc('presets:getAll', () => {
  const data = presetsStore.readAll();
  return data.presets || [];
});

handleIpc('presets:add', (_evt, preset) => {
  const data = presetsStore.readAll();
  const presets = data.presets || [];
  const newPreset = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...preset
  };
  presets.unshift(newPreset);
  data.presets = presets.slice(0, 100);
  presetsStore.writeAll(data);
  return newPreset;
});

handleIpc('presets:remove', (_evt, id) => {
  const data = presetsStore.readAll();
  data.presets = (data.presets || []).filter((p) => p.id !== id);
  presetsStore.writeAll(data);
  return data.presets;
});

// =================== IPC: Dialogo para elegir logo ===================
handleIpc('dialog:pickLogo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Seleccionar logo',
    filters: [{ name: 'Imagenes', extensions: ['png', 'svg', 'jpg', 'jpeg'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const base64 = buffer.toString('base64');
    return { filePath, dataUrl: `data:${mime};base64,${base64}` };
  } catch (err) {
    console.error('[dialog:pickLogo] Error leyendo el logo:', err);
    return null;
  }
});

// =================== IPC: Guardar QR (PNG / SVG) ===================
handleIpc('dialog:saveQr', async (_evt, { dataUrl, svgString, defaultName, format }) => {
  try {
    const defaultPath = path.join(
      configStore.get('lastSavePath', app.getPath('documents')),
      defaultName || 'Q-Link'
    );

    const filters =
      format === 'svg'
        ? [{ name: 'SVG', extensions: ['svg'] }]
        : [{ name: 'PNG', extensions: ['png'] }];

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar QR',
      defaultPath: `${defaultPath}.${format === 'svg' ? 'svg' : 'png'}`,
      filters
    });

    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    if (format === 'svg') {
      fs.writeFileSync(result.filePath, svgString, 'utf-8');
    } else {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
    }

    configStore.set('lastSavePath', path.dirname(result.filePath));
    return { ok: true, filePath: result.filePath };
  } catch (err) {
    console.error('[dialog:saveQr] Error guardando QR:', err);
    return { ok: false, error: err.message };
  }
});

// =================== IPC: Exportar entrada del historial ===================
handleIpc('dialog:exportHistoryItem', async (_evt, { dataUrl, svgString, format, suggestedName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar QR del historial',
      defaultPath: `${suggestedName || 'qr-historial'}.${format === 'svg' ? 'svg' : 'png'}`,
      filters:
        format === 'svg'
          ? [{ name: 'SVG', extensions: ['svg'] }]
          : [{ name: 'PNG', extensions: ['png'] }]
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };

    if (format === 'svg') {
      fs.writeFileSync(result.filePath, svgString, 'utf-8');
    } else {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      fs.writeFileSync(result.filePath, Buffer.from(base64, 'base64'));
    }
    return { ok: true, filePath: result.filePath };
  } catch (err) {
    console.error('[dialog:exportHistoryItem] Error:', err);
    return { ok: false, error: err.message };
  }
});

// =================== IPC: Copiar imagen al portapapeles ===================
handleIpc('clipboard:copyImage', (_evt, dataUrl) => {
  try {
    const image = nativeImage.createFromDataURL(dataUrl);
    clipboard.writeImage(image);
    return true;
  } catch (err) {
    console.error('[clipboard:copyImage] Error:', err);
    return false;
  }
});
