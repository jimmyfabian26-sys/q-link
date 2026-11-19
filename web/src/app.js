import './style.css';
import { DEFAULT_DESIGN, PRESETS, normalizeLink, wifiContent, createMatrix, analyzeContrast } from './core.js';
import { renderCanvas, renderSvg } from './render.js';

const $ = id => document.getElementById(id);
const config = __APP_CONFIG__;
const LEGACY_HISTORY_KEY = 'qlink.web.history.v1';
const THEME_KEY = 'qlink.web.theme.v1';
const state = { mode: 'link', design: { ...DEFAULT_DESIGN }, matrix: null, content: '', logo: null, logoData: null, busy: false };
let toastTimer, renderTimer, logoRevision = 0;
function toast(message) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200);
}
function readStorage(key) { try { return localStorage.getItem(key); } catch { return null; } }
function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch { toast('No se pudo guardar en este navegador. Puedes seguir generando y descargando QR.'); return false; }
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('themeToggle').textContent = theme === 'dark' ? '☼' : '☾';
  $('themeToggle').setAttribute('aria-label', `Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`);
}
function setEnabled(valid) {
  ['downloadPng', 'downloadSvg', 'copyImage'].forEach(id => { $(id).disabled = !valid; });
}
function syncDesign() {
  for (const key of ['color1', 'color2', 'background']) {
    $(key).value = state.design[key]; $(key + 'Value').textContent = state.design[key].toUpperCase();
  }
  $('direction').value = state.design.direction;
  $('logoScale').value = Math.round(state.design.logoScale * 100);
  $('logoScaleValue').textContent = `${Math.round(state.design.logoScale * 100)}%`;
  document.querySelectorAll('.preset').forEach((btn, i) => { btn.setAttribute('aria-pressed', String(PRESETS[i].color1 === state.design.color1 && PRESETS[i].color2 === state.design.color2)); });
}
function contentFromForm() {
  if (state.mode === 'link') return normalizeLink($('linkInput').value);
  if (state.mode === 'wifi') return wifiContent({ ssid: $('ssid').value, password: $('password').value, security: $('security').value, hidden: $('hiddenNetwork').checked });
  const text = $('textInput').value;
  if (!text.trim()) throw new Error('Escribe el texto que quieres compartir.');
  return text;
}
function refresh() {
  clearTimeout(renderTimer);
  try {
    state.content = contentFromForm();
    try { state.matrix = createMatrix(state.content); }
    catch { throw new Error('El contenido es demasiado largo para este QR. Prueba un texto o enlace más corto.'); }
    renderCanvas($('qrCanvas'), state.matrix, state.design, state.logo);
    $('qrCanvas').hidden = false; $('emptyPreview').hidden = true;
    $('inputStatus').className = 'input-status';
    $('inputStatus').textContent = state.mode === 'link' && state.content === 'https://example.com/' ? 'Enlace de ejemplo. Sustitúyelo por el tuyo.' : 'Listo. Tu QR se ha generado en este dispositivo.';
    const quality = analyzeContrast(state.design);
    document.querySelector('.quality').dataset.level = quality.level;
    $('qualityIcon').textContent = quality.level === 'good' ? '✓' : '!';
    $('qualityTitle').textContent = quality.level === 'good' ? 'Buen contraste' : quality.level === 'fair' ? 'Mejora el contraste' : 'Contraste bajo';
    $('qualityText').textContent = quality.level === 'good' ? 'Prueba su lectura antes de imprimir o compartir.' : 'Elige colores más oscuros y un fondo claro.';
    setEnabled(true);
  } catch (error) {
    state.matrix = null; state.content = '';
    $('qrCanvas').hidden = true; $('emptyPreview').hidden = false;
    $('inputStatus').className = 'input-status error'; $('inputStatus').textContent = error.message;
    $('qualityTitle').textContent = 'Esperando contenido'; $('qualityText').textContent = 'Completa los campos para generar tu QR.';
    document.querySelector('.quality').dataset.level = 'waiting'; $('qualityIcon').textContent = '◇';
    setEnabled(false);
  }
}
function delayedRefresh() {
  // Disable downloads immediately so a pending render cannot export stale content.
  setEnabled(false); state.matrix = null;
  clearTimeout(renderTimer); renderTimer = setTimeout(refresh, 140);
}
function switchMode(mode) {
  state.mode = mode;
  for (const candidate of ['link', 'wifi', 'text']) {
    $(candidate + 'Panel').hidden = candidate !== mode;
    $('tab-' + candidate).setAttribute('aria-selected', String(candidate === mode));
    $('tab-' + candidate).tabIndex = candidate === mode ? 0 : -1;
  }
  refresh();
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function pngBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen.')), 'image/png')); }
async function exportPng() {
  if (!state.matrix) return;
  try {
    const canvas = document.createElement('canvas');
    renderCanvas(canvas, state.matrix, state.design, state.logo, Number($('exportSize').value));
    download(await pngBlob(canvas), `q-link-${state.mode}.png`); toast('PNG preparado. Revisa las descargas de tu navegador.');
  } catch { toast('No se pudo descargar el PNG. Inténtalo de nuevo.'); }
}
function exportSvg() {
  if (!state.matrix) return;
  download(new Blob([renderSvg(state.matrix, state.design, state.logoData)], { type: 'image/svg+xml' }), `q-link-${state.mode}.svg`);
  toast('SVG preparado. Puedes ampliarlo sin perder calidad.');
}
async function copyImage() {
  if (!state.matrix) return;
  if (!navigator.clipboard?.write || !globalThis.ClipboardItem) { toast('Tu navegador no permite copiar imágenes. Usa Descargar PNG.'); return; }
  try {
    // Start clipboard write within the click gesture; Blob promise supports Safari.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob($('qrCanvas')) })]);
    toast('Imagen copiada al portapapeles.');
  } catch { toast('No se pudo copiar la imagen. Usa Descargar PNG o permite el portapapeles.'); }
}
async function addLogo(event) {
  const version = ++logoRevision, file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { toast('Elige una imagen PNG o JPG de hasta 2 MB.'); return; }
  const url = URL.createObjectURL(file), image = new Image();
  try {
    image.src = url; await image.decode();
    if (version !== logoRevision) return;
    if (image.width * image.height > 25_000_000) throw new Error('dimensions');
    const buffer = document.createElement('canvas'), scale = Math.min(1, 512 / Math.max(image.width, image.height));
    buffer.width = Math.max(1, Math.round(image.width * scale)); buffer.height = Math.max(1, Math.round(image.height * scale));
    buffer.getContext('2d').drawImage(image, 0, 0, buffer.width, buffer.height);
    const raster = new Image(), data = buffer.toDataURL('image/png'); raster.src = data; await raster.decode();
    if (version !== logoRevision) return;
    state.logo = raster; state.logoData = data; $('logoOptions').hidden = false; refresh(); toast('Logo añadido. Prueba la lectura de tu QR.');
  } catch { toast('No se pudo abrir esa imagen. Prueba otra más pequeña.'); }
  finally { URL.revokeObjectURL(url); }
}
function removeLogo() { ++logoRevision; state.logo = null; state.logoData = null; $('logoOptions').hidden = true; refresh(); }
for (const [index, preset] of PRESETS.entries()) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'preset'; button.setAttribute('aria-pressed', String(index === 0));
  const dot = document.createElement('span'); dot.className = 'preset-dot'; dot.style.background = `linear-gradient(135deg,${preset.color1},${preset.color2})`;
  const label = document.createElement('span'); label.textContent = preset.name; button.append(dot, label);
  button.addEventListener('click', () => { Object.assign(state.design, preset, { background: '#ffffff' }); syncDesign(); refresh(); });
  $('presets').append(button);
}
for (const mode of ['link', 'wifi', 'text']) $('tab-' + mode).addEventListener('click', () => switchMode(mode));
document.querySelector('.tabs').addEventListener('keydown', event => {
  const modes = ['link', 'wifi', 'text'], current = modes.indexOf(state.mode);
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % 3;
  if (event.key === 'ArrowLeft') next = (current + 2) % 3;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = 2;
  if (next !== undefined) { event.preventDefault(); switchMode(modes[next]); $('tab-' + modes[next]).focus(); }
});
['linkInput', 'textInput', 'ssid', 'password'].forEach(id => $(id).addEventListener('input', delayedRefresh));
$('security').addEventListener('change', () => { $('password').disabled = $('security').value === 'nopass'; refresh(); });
$('hiddenNetwork').addEventListener('change', refresh);
$('passwordToggle').addEventListener('click', () => {
  const show = $('password').type === 'password'; $('password').type = show ? 'text' : 'password';
  $('passwordToggle').textContent = show ? 'Ocultar' : 'Ver'; $('passwordToggle').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); $('passwordToggle').setAttribute('aria-pressed', String(show));
});
['color1', 'color2', 'background'].forEach(id => $(id).addEventListener('input', () => { state.design[id] = $(id).value; syncDesign(); refresh(); }));
$('direction').addEventListener('change', () => { state.design.direction = $('direction').value; refresh(); });
$('resetDesign').addEventListener('click', () => { state.design = { ...DEFAULT_DESIGN }; removeLogo(); syncDesign(); refresh(); });
$('logoInput').addEventListener('change', addLogo);
$('removeLogo').addEventListener('click', removeLogo);
$('logoScale').addEventListener('input', () => { state.design.logoScale = Number($('logoScale').value) / 100; syncDesign(); refresh(); });
$('downloadPng').addEventListener('click', exportPng); $('downloadSvg').addEventListener('click', exportSvg); $('copyImage').addEventListener('click', copyImage);
$('themeToggle').addEventListener('click', () => { const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; setTheme(next); writeStorage(THEME_KEY, next); });
for (const id of ['donate', 'topDonate']) {
  if (config.donationUrl) $(id).href = config.donationUrl; else $(id).hidden = true;
}
$('authorLink').href = config.authorUrl;
// Eliminar el historial guardado por versiones anteriores, si existe.
try { localStorage.removeItem(LEGACY_HISTORY_KEY); } catch { /* Almacenamiento bloqueado por el navegador. */ }
setTheme(readStorage(THEME_KEY) === 'light' ? 'light' : 'dark'); syncDesign(); refresh();
