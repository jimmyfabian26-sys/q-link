// app.js
// Orquestador principal de Q-Link. Conecta la UI con los modulos:
// gradient-engine, design-analyzer, qr-generator, link-mode, wifi-mode
// e history. Equivalente al cuerpo de la clase QLink en Python, pero
// organizado como un objeto de estado + funciones puras de render.

(function () {
  'use strict';

  // ---------- ESTADO GLOBAL (equivalente a self.* en Python) ----------
  const state = {
    mode: 'link', // 'link' | 'wifi'
    qrColor1: '#000000',
    qrColor2: '#000000',
    bgColor1: '#ffffff',
    bgColor2: '#ffffff',
    qrGradMode: 'diagonal',
    bgGradMode: 'diagonal',
    logoImageEl: null,
    logoDataUrl: null,
    logoScale: 0.22,
    logoWhiteBg: true,
    currentContent: '',
    currentMatrix: null,
    currentMatrixSize: 0,
    currentMeta: null,
    isDarkMode: true,
    colorPickerTarget: null,
    panelOpen: false
  };

  // ---------- REFERENCIAS DOM ----------
  const $ = (id) => document.getElementById(id);

  const els = {
    body: document.body,
    urlInput: $('urlInput'),
    linkStatus: $('linkStatus'),
    linkPanel: $('linkPanel'),
    wifiPanel: $('wifiPanel'),
    modeLinkBtn: $('modeLinkBtn'),
    modeWifiBtn: $('modeWifiBtn'),
    wifiSsid: $('wifiSsid'),
    wifiPassword: $('wifiPassword'),
    wifiSecurity: $('wifiSecurity'),
    wifiHidden: $('wifiHidden'),
    wifiStatus: $('wifiStatus'),
    qrCanvas: $('qrCanvas'),
    qrEmptyMsg: $('qrEmptyMsg'),
    designScore: $('designScore'),
    scoreBadge: $('scoreBadge'),
    scoreRatio: $('scoreRatio'),
    btnEdit: $('btnEdit'),
    btnSave: $('btnSave'),
    customizePanel: $('customizePanel'),
    btnQr1: $('btnQr1'),
    btnQr2: $('btnQr2'),
    btnBg1: $('btnBg1'),
    btnBg2: $('btnBg2'),
    dirRowQr: $('dirRowQr'),
    dirRowBg: $('dirRowBg'),
    btnAddLogo: $('btnAddLogo'),
    logoControls: $('logoControls'),
    logoSlider: $('logoSlider'),
    logoWhiteBgCk: $('logoWhiteBg'),
    btnRemoveLogo: $('btnRemoveLogo'),
    logoFileInput: $('logoFileInput'),
    btnReset: $('btnReset'),
    btnSavePreset: $('btnSavePreset'),
    colorPickerInput: $('colorPickerInput'),
    btnTheme: $('btnTheme'),
    btnHistory: $('btnHistory'),
    btnPresets: $('btnPresets'),
    historyModal: $('historyModal'),
    closeHistory: $('closeHistory'),
    historyList: $('historyList'),
    btnClearHistory: $('btnClearHistory'),
    presetsModal: $('presetsModal'),
    closePresets: $('closePresets'),
    presetsGridDefault: $('presetsGridDefault'),
    presetsGridUser: $('presetsGridUser'),
    exportModal: $('exportModal'),
    closeExport: $('closeExport'),
    btnExportSvg: $('btnExportSvg'),
    btnCopyClipboard: $('btnCopyClipboard'),
    toast: $('toast')
  };

  const allCustomWidgets = () => [
    els.btnQr1, els.btnQr2, els.btnBg1, els.btnBg2,
    els.btnAddLogo, els.btnReset, els.btnSavePreset, els.btnSave,
    ...els.dirRowQr.querySelectorAll('.dir-btn'),
    ...els.dirRowBg.querySelectorAll('.dir-btn')
  ];

  // ---------- UTILIDADES ----------
  function showToast(message, isError = false) {
    els.toast.textContent = message;
    els.toast.classList.toggle('error', isError);
    els.toast.classList.add('show');
    els.toast.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      els.toast.classList.remove('show');
    }, 2600);
  }

  function setControlsEnabled(enabled) {
    allCustomWidgets().forEach((w) => {
      if (w) w.disabled = !enabled;
    });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ---------- VALIDACION SEGUN EL MODO ----------
  function evaluateCurrentInput() {
    if (state.mode === 'link') {
      const raw = els.urlInput.value.trim();
      if (!raw) {
        els.linkStatus.textContent = 'Esperando URL...';
        els.linkStatus.className = 'status-text';
        els.urlInput.classList.remove('valid', 'invalid');
        clearQr();
        setControlsEnabled(false);
        return;
      }
      const valid = window.LinkMode.isValidUrl(raw);
      els.urlInput.classList.toggle('valid', valid);
      els.urlInput.classList.toggle('invalid', !valid);
      setControlsEnabled(valid);
      if (valid) {
        els.linkStatus.textContent = '✓ Enlace Válido';
        els.linkStatus.className = 'status-text success';
        renderQr(window.LinkMode.normalizeUrl(raw), 'link', { label: raw });
      } else {
        els.linkStatus.textContent = '✗ Enlace Inválido';
        els.linkStatus.className = 'status-text error';
        clearQr();
      }
    } else {
      const ssid = els.wifiSsid.value;
      const password = els.wifiPassword.value;
      const security = els.wifiSecurity.value;
      const hidden = els.wifiHidden.checked;

      if (!ssid.trim()) {
        els.wifiStatus.textContent = 'Completa el formulario de la red...';
        els.wifiStatus.className = 'status-text';
        clearQr();
        setControlsEnabled(false);
        return;
      }

      const { valid, errors } = window.WifiMode.validateWifiForm({ ssid, password, security });
      setControlsEnabled(valid);
      if (valid) {
        els.wifiStatus.textContent = '✓ Red Lista para Generar QR';
        els.wifiStatus.className = 'status-text success';
        const wifiString = window.WifiMode.buildWifiString({ ssid, password, security, hidden });
        renderQr(wifiString, 'wifi', { label: ssid });
      } else {
        els.wifiStatus.textContent = `✗ ${errors[0]}`;
        els.wifiStatus.className = 'status-text error';
        clearQr();
      }
    }
  }

  const debouncedEvaluate = debounce(evaluateCurrentInput, 180);

  // ---------- RENDER DEL QR ----------
  async function renderQr(content, type, meta) {
    const result = window.qlink.qr.generateMatrix(content);
    if (!result.ok) {
      showToast('No se pudo generar el QR: ' + result.error, true);
      clearQr();
      return;
    }

    state.currentContent = content;
    state.currentMatrix = result.matrix;
    state.currentMatrixSize = result.size;
    state.currentMeta = { type, ...meta };

    const canvas = window.QrGenerator.renderQrCanvas({
      matrix: result.matrix,
      size: result.size,
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      qrGradMode: state.qrGradMode,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      bgGradMode: state.bgGradMode,
      logoImage: state.logoImageEl,
      logoScale: state.logoScale,
      logoWhiteBg: state.logoWhiteBg
    });

    const ctx = els.qrCanvas.getContext('2d');
    els.qrCanvas.width = canvas.width;
    els.qrCanvas.height = canvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);

    els.qrCanvas.classList.remove('hidden');
    els.qrEmptyMsg.classList.add('hidden');

    runDesignAnalysis();
    saveToHistory();
  }

  function clearQr() {
    const ctx = els.qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, els.qrCanvas.width, els.qrCanvas.height);
    els.qrCanvas.classList.add('hidden');
    els.qrEmptyMsg.classList.remove('hidden');
    els.designScore.hidden = true;
    state.currentContent = '';
    state.currentMatrix = null;
  }

  function runDesignAnalysis() {
    const analysis = window.DesignAnalyzer.analyzeDesign({
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      hasLogo: Boolean(state.logoImageEl),
      logoScale: state.logoScale
    });

    els.designScore.hidden = false;
    els.scoreBadge.textContent = analysis.score;
    els.scoreBadge.className = `score-badge ${analysis.score.toLowerCase()}`;
    els.scoreRatio.textContent = `Contraste ${analysis.contrastRatio}:1`;
    els.scoreBadge.title = analysis.recommendations.join(' ');
  }

  // ---------- HISTORIAL ----------
  const saveToHistory = debounce(async () => {
    if (!state.currentContent || state.mode === 'wifi') return;
    try {
      await window.HistoryManager.add({
        content: state.currentContent,
        type: state.currentMeta.type,
        label: state.currentMeta.label || state.currentContent.slice(0, 40),
        design: snapshotDesign()
      });
    } catch (err) {
      console.error('Error guardando historial:', err);
    }
  }, 900);

  function snapshotDesign() {
    return {
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      qrGradMode: state.qrGradMode,
      bgGradMode: state.bgGradMode,
      logoScale: state.logoScale,
      logoWhiteBg: state.logoWhiteBg,
      hasLogo: Boolean(state.logoImageEl),
      logoDataUrl: state.logoDataUrl
    };
  }

  async function openHistoryModal() {
    const items = await window.HistoryManager.getAll();
    els.historyList.innerHTML = '';
    if (!items.length) {
      els.historyList.innerHTML = '<p class="empty-state">No hay QRs guardados todavía.</p>';
    } else {
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'history-item';
        const date = new Date(item.createdAt).toLocaleString('es-EC');
        const swatchColor = item.design && item.design.qrColor1 ? item.design.qrColor1 : '#333';
        row.innerHTML = `
          <div class="history-thumb" style="background:${swatchColor}"></div>
          <div class="history-info">
            <div class="label">${escapeHtml(item.label || item.content)}</div>
            <div class="meta">${item.type === 'wifi' ? 'WiFi' : 'Link'} · ${date}</div>
          </div>
          <div class="history-actions">
            <button data-action="use" title="Reutilizar">↺</button>
            <button data-action="export" title="Exportar">⭳</button>
            <button data-action="delete" title="Eliminar">✕</button>
          </div>`;
        row.querySelector('[data-action="use"]').addEventListener('click', () => applyHistoryItem(item));
        row.querySelector('[data-action="export"]').addEventListener('click', () => exportHistoryItem(item));
        row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
          await window.HistoryManager.remove(item.id);
          openHistoryModal();
        });
        els.historyList.appendChild(row);
      });
    }
    els.historyModal.classList.remove('hidden');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function applyHistoryItem(item) {
    if (item.type === 'wifi') {
      switchMode('wifi');
      showToast('Diseño restaurado. Vuelve a escribir el SSID y la clave por seguridad.');
    } else {
      switchMode('link');
      els.urlInput.value = item.content.replace(/^https?:\/\//, '');
    }
    if (item.design) {
      Object.assign(state, {
        qrColor1: item.design.qrColor1,
        qrColor2: item.design.qrColor2,
        bgColor1: item.design.bgColor1,
        bgColor2: item.design.bgColor2,
        qrGradMode: item.design.qrGradMode,
        bgGradMode: item.design.bgGradMode,
        logoScale: item.design.logoScale,
        logoWhiteBg: item.design.logoWhiteBg
      });
      updateSwatchUI();
      els.logoSlider.value = Math.round(state.logoScale * 100);
    }
    els.historyModal.classList.add('hidden');
    evaluateCurrentInput();
  }

  async function exportHistoryItem(item) {
    const result = window.qlink.qr.generateMatrix(item.content);
    if (!result.ok) return showToast('No se pudo regenerar ese QR.', true);
    const design = item.design || {};
    const canvas = window.QrGenerator.renderQrCanvas({
      matrix: result.matrix,
      size: result.size,
      qrColor1: design.qrColor1 || '#000',
      qrColor2: design.qrColor2 || '#000',
      qrGradMode: design.qrGradMode || 'diagonal',
      bgColor1: design.bgColor1 || '#fff',
      bgColor2: design.bgColor2 || '#fff',
      bgGradMode: design.bgGradMode || 'diagonal',
      logoImage: null,
      logoScale: design.logoScale || 0.22,
      logoWhiteBg: true
    });
    const dataUrl = canvas.toDataURL('image/png');
    const res = await window.qlink.dialogs.exportHistoryItem({
      dataUrl,
      format: 'png',
      suggestedName: (item.label || 'qr-historial').replace(/[^a-z0-9-_]/gi, '_')
    });
    if (res.ok) showToast('QR exportado correctamente.');
  }

  // ---------- PRESETS ----------
  async function openPresetsModal() {
    const [defaults, userPresets] = await Promise.all([
      window.qlink.presets.getDefaults(),
      window.qlink.presets.getAll()
    ]);
    renderPresetGrid(els.presetsGridDefault, defaults, false);
    if (userPresets.length) {
      renderPresetGrid(els.presetsGridUser, userPresets, true);
    } else {
      els.presetsGridUser.innerHTML = '<p class="empty-state">Aún no has guardado presets propios.</p>';
    }
    els.presetsModal.classList.remove('hidden');
  }

  function renderPresetGrid(container, presets, removable) {
    container.innerHTML = '';
    presets.forEach((preset) => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      const grad = `linear-gradient(135deg, ${preset.qrColor1}, ${preset.qrColor2})`;
      card.innerHTML = `
        <div class="preset-swatch" style="background:${grad}"></div>
        <div class="preset-name">${escapeHtml(preset.name)}</div>
        ${removable ? '<button class="preset-remove">Eliminar</button>' : ''}`;
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('preset-remove')) return;
        applyPreset(preset);
      });
      if (removable) {
        card.querySelector('.preset-remove').addEventListener('click', async (e) => {
          e.stopPropagation();
          await window.qlink.presets.remove(preset.id);
          openPresetsModal();
        });
      }
      container.appendChild(card);
    });
  }

  function applyPreset(preset) {
    Object.assign(state, {
      qrColor1: preset.qrColor1,
      qrColor2: preset.qrColor2,
      bgColor1: preset.bgColor1,
      bgColor2: preset.bgColor2,
      qrGradMode: preset.qrGradMode,
      bgGradMode: preset.bgGradMode,
      logoScale: preset.logoScale != null ? preset.logoScale : state.logoScale
    });
    updateSwatchUI();
    els.logoSlider.value = Math.round(state.logoScale * 100);
    els.presetsModal.classList.add('hidden');
    evaluateCurrentInput();
    showToast(`Preset "${preset.name}" aplicado.`);
  }

  async function saveCurrentAsPreset() {
    const name = (prompt('Nombre del preset:', 'Mi preset') || '').trim();
    if (!name) return;
    await window.qlink.presets.add({
      name,
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      qrGradMode: state.qrGradMode,
      bgGradMode: state.bgGradMode,
      logoScale: state.logoScale
    });
    showToast('Preset guardado correctamente.');
  }

  // ---------- UI: SWATCHES Y DIRECCIONES ----------
  function updateSwatchUI() {
    els.btnQr1.style.background = state.qrColor1;
    els.btnQr2.style.background = state.qrColor2;
    els.btnBg1.style.background = state.bgColor1;
    els.btnBg2.style.background = state.bgColor2;

    els.dirRowQr.querySelectorAll('.dir-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === state.qrGradMode);
    });
    els.dirRowBg.querySelectorAll('.dir-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.mode === state.bgGradMode);
    });
  }

  function setGradMode(target, mode) {
    if (target === 'qr') {
      if (state.qrGradMode === mode) {
        [state.qrColor1, state.qrColor2] = [state.qrColor2, state.qrColor1];
      }
      state.qrGradMode = mode;
    } else {
      if (state.bgGradMode === mode) {
        [state.bgColor1, state.bgColor2] = [state.bgColor2, state.bgColor1];
      }
      state.bgGradMode = mode;
    }
    updateSwatchUI();
    evaluateCurrentInput();
  }

  function pickColor(target) {
    state.colorPickerTarget = target;
    const current = {
      qr1: state.qrColor1, qr2: state.qrColor2,
      bg1: state.bgColor1, bg2: state.bgColor2
    }[target];
    els.colorPickerInput.value = current;
    els.colorPickerInput.click();
  }

  els.colorPickerInput.addEventListener('input', () => {
    const value = els.colorPickerInput.value;
    const target = state.colorPickerTarget;
    if (!target) return;
    if (target === 'qr1') state.qrColor1 = value;
    else if (target === 'qr2') state.qrColor2 = value;
    else if (target === 'bg1') state.bgColor1 = value;
    else if (target === 'bg2') state.bgColor2 = value;
    updateSwatchUI();
    evaluateCurrentInput();
  });

  // ---------- MODO LINK / WIFI ----------
  function switchMode(mode) {
    state.mode = mode;
    els.linkPanel.classList.toggle('hidden', mode !== 'link');
    els.wifiPanel.classList.toggle('hidden', mode !== 'wifi');
    els.modeLinkBtn.classList.toggle('active', mode === 'link');
    els.modeLinkBtn.setAttribute('aria-selected', mode === 'link');
    els.modeWifiBtn.classList.toggle('active', mode === 'wifi');
    els.modeWifiBtn.setAttribute('aria-selected', mode === 'wifi');
    evaluateCurrentInput();
  }

  // ---------- LOGO ----------
  async function addLogo() {
    const result = await window.qlink.dialogs.pickLogo();
    if (!result) return;
    const img = new Image();
    img.onload = () => {
      state.logoImageEl = img;
      state.logoDataUrl = result.dataUrl;
      els.logoControls.classList.remove('hidden');
      evaluateCurrentInput();
    };
    img.onerror = () => showToast('No se pudo cargar el logo seleccionado.', true);
    img.src = result.dataUrl;
  }

  function removeLogo() {
    state.logoImageEl = null;
    state.logoDataUrl = null;
    els.logoControls.classList.add('hidden');
    evaluateCurrentInput();
  }

  // ---------- TEMA ----------
  function applyTheme() {
    els.body.dataset.theme = state.isDarkMode ? 'dark' : 'light';
    els.btnTheme.textContent = state.isDarkMode ? '🌙' : '☀️';
  }

  function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    applyTheme();
    window.qlink.config.set('themeMode', state.isDarkMode ? 'dark' : 'light');
  }

  // ---------- RESET ----------
  function resetAll() {
    state.bgColor1 = '#ffffff';
    state.bgColor2 = '#ffffff';
    state.qrColor1 = '#000000';
    state.qrColor2 = '#000000';
    state.qrGradMode = 'diagonal';
    state.bgGradMode = 'diagonal';
    removeLogo();
    updateSwatchUI();
    evaluateCurrentInput();
  }

  // ---------- PANEL DE EDICION ----------
  function togglePanel() {
    state.panelOpen = !state.panelOpen;
    els.customizePanel.classList.toggle('open', state.panelOpen);
    els.btnEdit.setAttribute('aria-pressed', String(state.panelOpen));
  }

  // ---------- EXPORTAR ----------
  function openExportModal() {
    if (!state.currentMatrix) {
      showToast('Genera un QR antes de exportar.', true);
      return;
    }
    els.exportModal.classList.remove('hidden');
  }

  function buildExportCanvas(targetSize) {
    const baseCanvas = window.QrGenerator.renderQrCanvas({
      matrix: state.currentMatrix,
      size: state.currentMatrixSize,
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      qrGradMode: state.qrGradMode,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      bgGradMode: state.bgGradMode,
      logoImage: state.logoImageEl,
      logoScale: state.logoScale,
      logoWhiteBg: state.logoWhiteBg
    });
    if (targetSize === baseCanvas.width) return baseCanvas;
    const scaled = document.createElement('canvas');
    scaled.width = targetSize;
    scaled.height = targetSize;
    const ctx = scaled.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(baseCanvas, 0, 0, targetSize, targetSize);
    return scaled;
  }

  async function exportPng(size) {
    const canvas = buildExportCanvas(size);
    const dataUrl = canvas.toDataURL('image/png');
    const res = await window.qlink.dialogs.saveQr({
      dataUrl,
      defaultName: `Q-Link-${size}px`,
      format: 'png'
    });
    if (res.ok) {
      showToast('✅ ¡Guardado con éxito!');
      els.exportModal.classList.add('hidden');
    } else if (res.error) {
      showToast('Error al guardar: ' + res.error, true);
    }
  }

  async function exportSvg() {
    const svgString = window.QrGenerator.renderQrSvg({
      matrix: state.currentMatrix,
      size: state.currentMatrixSize,
      qrColor1: state.qrColor1,
      qrColor2: state.qrColor2,
      qrGradMode: state.qrGradMode,
      bgColor1: state.bgColor1,
      bgColor2: state.bgColor2,
      bgGradMode: state.bgGradMode,
      logoDataUrl: state.logoDataUrl,
      logoScale: state.logoScale
    });
    const res = await window.qlink.dialogs.saveQr({
      svgString,
      defaultName: 'Q-Link',
      format: 'svg'
    });
    if (res.ok) {
      showToast('✅ ¡SVG guardado con éxito!');
      els.exportModal.classList.add('hidden');
    } else if (res.error) {
      showToast('Error al guardar: ' + res.error, true);
    }
  }

  async function copyToClipboard() {
    const canvas = buildExportCanvas(window.QrGenerator.QR_SIZE);
    const dataUrl = canvas.toDataURL('image/png');
    const ok = await window.qlink.clipboard.copyImage(dataUrl);
    showToast(ok ? 'Imagen copiada al portapapeles.' : 'No se pudo copiar la imagen.', !ok);
    if (ok) els.exportModal.classList.add('hidden');
  }

  // ---------- EVENTOS ----------
  function bindEvents() {
    els.urlInput.addEventListener('input', debouncedEvaluate);
    els.wifiSsid.addEventListener('input', debouncedEvaluate);
    els.wifiPassword.addEventListener('input', debouncedEvaluate);
    els.wifiSecurity.addEventListener('change', evaluateCurrentInput);
    els.wifiHidden.addEventListener('change', evaluateCurrentInput);

    els.modeLinkBtn.addEventListener('click', () => switchMode('link'));
    els.modeWifiBtn.addEventListener('click', () => switchMode('wifi'));

    els.btnQr1.addEventListener('click', () => pickColor('qr1'));
    els.btnQr2.addEventListener('click', () => pickColor('qr2'));
    els.btnBg1.addEventListener('click', () => pickColor('bg1'));
    els.btnBg2.addEventListener('click', () => pickColor('bg2'));

    document.querySelectorAll('.dir-btn').forEach((btn) => {
      btn.addEventListener('click', () => setGradMode(btn.dataset.target, btn.dataset.mode));
    });

    els.btnAddLogo.addEventListener('click', addLogo);
    els.btnRemoveLogo.addEventListener('click', removeLogo);
    els.logoSlider.addEventListener('input', () => {
      state.logoScale = Number(els.logoSlider.value) / 100;
      evaluateCurrentInput();
    });
    els.logoWhiteBgCk.addEventListener('change', () => {
      state.logoWhiteBg = els.logoWhiteBgCk.checked;
      evaluateCurrentInput();
    });

    els.btnReset.addEventListener('click', resetAll);
    els.btnSavePreset.addEventListener('click', saveCurrentAsPreset);

    els.btnEdit.addEventListener('click', togglePanel);
    els.btnSave.addEventListener('click', openExportModal);

    els.btnTheme.addEventListener('click', toggleTheme);

    els.btnHistory.addEventListener('click', openHistoryModal);
    els.closeHistory.addEventListener('click', () => els.historyModal.classList.add('hidden'));
    els.btnClearHistory.addEventListener('click', async () => {
      await window.HistoryManager.clear();
      openHistoryModal();
    });

    els.btnPresets.addEventListener('click', openPresetsModal);
    els.closePresets.addEventListener('click', () => els.presetsModal.classList.add('hidden'));

    els.closeExport.addEventListener('click', () => els.exportModal.classList.add('hidden'));
    document.querySelectorAll('.export-row [data-size]').forEach((btn) => {
      btn.addEventListener('click', () => exportPng(Number(btn.dataset.size)));
    });
    els.btnExportSvg.addEventListener('click', exportSvg);
    els.btnCopyClipboard.addEventListener('click', copyToClipboard);

    // Cerrar modales al hacer click fuera de la caja
    [els.historyModal, els.presetsModal, els.exportModal].forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    });
  }

  // ---------- INICIALIZACION ----------
  async function init() {
    bindEvents();
    setControlsEnabled(false);
    updateSwatchUI();
    clearQr();

    const savedTheme = await window.qlink.config.get('themeMode');
    state.isDarkMode = savedTheme !== 'light';
    applyTheme();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
