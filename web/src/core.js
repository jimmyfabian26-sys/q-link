import QRCode from 'qrcode';

export const DEFAULT_DESIGN = Object.freeze({ color1: '#182755', color2: '#6651cf', background: '#ffffff', direction: 'diagonal', logoScale: 0.16 });
export const PRESETS = Object.freeze([
  { name: 'Original', color1: '#182755', color2: '#6651cf' },
  { name: 'Tinta', color1: '#111827', color2: '#111827' },
  { name: 'Océano', color1: '#064e63', color2: '#075985' },
  { name: 'Bosque', color1: '#064e3b', color2: '#166534' },
  { name: 'Cereza', color1: '#701a3d', color2: '#9f1239' },
]);
const isHex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
export function cleanDesign(value = {}) {
  return {
    color1: isHex(value.color1) ? value.color1 : DEFAULT_DESIGN.color1,
    color2: isHex(value.color2) ? value.color2 : DEFAULT_DESIGN.color2,
    background: isHex(value.background) ? value.background : DEFAULT_DESIGN.background,
    direction: ['diagonal', 'horizontal', 'vertical', 'radial'].includes(value.direction) ? value.direction : 'diagonal',
    logoScale: Math.max(0.10, Math.min(0.20, Number(value.logoScale) || 0.16)),
  };
}
export function normalizeLink(raw) {
  const text = raw.trim();
  if (!text) throw new Error('Escribe el enlace que quieres compartir.');
  if (/\s/.test(text)) throw new Error('El enlace no puede contener espacios.');
  if (/^(javascript|data|file|vbscript|mailto|ftp):/i.test(text)) throw new Error('Utiliza un enlace http o https.');
  let url;
  try { url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`); }
  catch { throw new Error('Revisa el enlace. Por ejemplo: ejemplo.com'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error('Usa una dirección web válida sin credenciales.');
  return url.href;
}
export function wifiContent({ ssid, password, security = 'WPA', hidden = false }) {
  if (!ssid?.trim()) throw new Error('Escribe el nombre de la red.');
  if (new TextEncoder().encode(ssid).length > 32) throw new Error('El nombre de la red admite hasta 32 bytes.');
  if (!['WPA', 'WEP', 'nopass'].includes(security)) throw new Error('Selecciona un tipo de seguridad válido.');
  if (security !== 'nopass' && !password) throw new Error('Escribe la contraseña de la red.');
  const esc = v => String(v).replace(/([\\;,:\"])/g, '\\$1');
  return `WIFI:S:${esc(ssid)};T:${security};P:${security === 'nopass' ? '' : esc(password)};H:${hidden ? 'true' : 'false'};;`;
}
export function createMatrix(content) {
  const code = QRCode.create(content, { errorCorrectionLevel: 'H' });
  return { size: code.modules.size, data: Array.from(code.modules.data, Boolean) };
}
function luminance(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
export function analyzeContrast(design) {
  const bg = luminance(design.background);
  // Conventional dark modules over a lighter background are more widely readable.
  const foreground = Math.max(luminance(design.color1), luminance(design.color2));
  const ratio = (bg + 0.05) / (foreground + 0.05);
  return { ratio, level: ratio >= 4.5 ? 'good' : ratio >= 3 ? 'fair' : 'poor' };
}
