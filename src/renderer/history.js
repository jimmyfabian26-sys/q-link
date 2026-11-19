// history.js
// Capa del renderer que gestiona el historial de QRs generados.
// La persistencia real ocurre en main.js (archivo JSON en userData);
// este modulo solo orquesta las llamadas IPC expuestas en preload.js.

const HistoryManager = {
  /**
   * Obtiene todo el historial guardado, mas reciente primero.
   */
  async getAll() {
    return window.qlink.history.getAll();
  },

  /**
   * Guarda una nueva entrada del historial.
   * @param {Object} entry
   * @param {string} entry.content   contenido bruto codificado en el QR
   * @param {'link'|'wifi'} entry.type
   * @param {Object} entry.design    configuracion de diseño usada (colores, logo, etc.)
   * @param {string} [entry.label]   etiqueta legible (ej. dominio o SSID)
   * @param {string} [entry.thumbnail] dataURL pequeño para previsualizar en el panel
   */
  async add(entry) {
    return window.qlink.history.add(entry);
  },

  async remove(id) {
    return window.qlink.history.remove(id);
  },

  async clear() {
    return window.qlink.history.clear();
  }
};

window.HistoryManager = HistoryManager;
