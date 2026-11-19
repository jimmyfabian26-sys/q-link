// preload.js
// Expone una API minima y segura al renderer mediante contextBridge.
// contextIsolation esta activo, por lo que el renderer NUNCA tiene acceso
// directo a Node.js ni a los modulos de Electron.

const { contextBridge, ipcRenderer } = require('electron');
const QRCode = require('qrcode');

contextBridge.exposeInMainWorld('qlink', {
  // ---------- Generacion de la matriz QR (libreria 'qrcode') ----------
  // Se calcula en preload (con acceso a Node) y se entrega al renderer como
  // una matriz plana de booleanos + el tamano, para que el renderer la
  // pinte con sus propios degradados via Canvas 2D.
  qr: {
    generateMatrix: (text) => {
      try {
        // ERROR_CORRECT_H equivalente: 'H' en la libreria 'qrcode'
        const qrData = QRCode.create(text, {
          errorCorrectionLevel: 'H',
          version: undefined
        });
        const { size, data } = qrData.modules;
        const matrix = [];
        for (let row = 0; row < size; row++) {
          const rowArr = [];
          for (let col = 0; col < size; col++) {
            rowArr.push(Boolean(data[row * size + col]));
          }
          matrix.push(rowArr);
        }
        return { ok: true, size, matrix };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    }
  },
  // ---------- Configuracion ----------
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value)
  },

  // ---------- Historial ----------
  history: {
    getAll: () => ipcRenderer.invoke('history:getAll'),
    add: (entry) => ipcRenderer.invoke('history:add', entry),
    remove: (id) => ipcRenderer.invoke('history:remove', id),
    clear: () => ipcRenderer.invoke('history:clear')
  },

  // ---------- Presets personalizados ----------
  presets: {
    getAll: () => ipcRenderer.invoke('presets:getAll'),
    add: (preset) => ipcRenderer.invoke('presets:add', preset),
    remove: (id) => ipcRenderer.invoke('presets:remove', id),
    getDefaults: () => ipcRenderer.invoke('presets:getDefaults')
  },

  // ---------- Dialogos de archivo ----------
  dialogs: {
    pickLogo: () => ipcRenderer.invoke('dialog:pickLogo'),
    saveQr: (payload) => ipcRenderer.invoke('dialog:saveQr', payload),
    exportHistoryItem: (payload) => ipcRenderer.invoke('dialog:exportHistoryItem', payload)
  },

  // ---------- Portapapeles ----------
  clipboard: {
    copyImage: (dataUrl) => ipcRenderer.invoke('clipboard:copyImage', dataUrl)
  },

  // ---------- Info de plataforma ----------
  platform: process.platform
});
