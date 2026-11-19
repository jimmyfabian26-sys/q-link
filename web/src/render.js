import { cleanDesign } from './core.js';

export function renderCanvas(canvas, matrix, rawDesign, logo = null, resolution = 1024) {
  const design = cleanDesign(rawDesign);
  canvas.width = canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  const total = matrix.size + 8;
  const unit = resolution / total;
  const edge = Math.round(4 * unit);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, resolution, resolution);
  ctx.fillStyle = design.background;
  ctx.fillRect(edge, edge, resolution - 2 * edge, resolution - 2 * edge);
  let gradient;
  if (design.direction === 'radial') gradient = ctx.createRadialGradient(resolution / 2, resolution / 2, 0, resolution / 2, resolution / 2, resolution / Math.sqrt(2));
  else gradient = ctx.createLinearGradient(0, 0, design.direction === 'vertical' ? 0 : resolution, design.direction === 'horizontal' ? 0 : resolution);
  gradient.addColorStop(0, design.color1); gradient.addColorStop(1, design.color2);
  ctx.fillStyle = gradient;
  for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) {
    if (!matrix.data[row * matrix.size + col]) continue;
    const x = Math.round((col + 4) * unit), y = Math.round((row + 4) * unit);
    ctx.fillRect(x, y, Math.round((col + 5) * unit) - x, Math.round((row + 5) * unit) - y);
  }
  if (logo) {
    const size = Math.round(matrix.size * unit * design.logoScale), pad = Math.round(size * 0.12);
    const xy = Math.round((resolution - size) / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(xy - pad, xy - pad, size + 2 * pad, size + 2 * pad);
    const scale = Math.min(size / logo.width, size / logo.height);
    const w = logo.width * scale, h = logo.height * scale;
    ctx.drawImage(logo, (resolution - w) / 2, (resolution - h) / 2, w, h);
  }
  return canvas;
}

export function renderSvg(matrix, rawDesign, logoData = null, logoAspect = 1) {
  const design = cleanDesign(rawDesign), total = matrix.size + 8;
  const gradient = design.direction === 'radial'
    ? `<radialGradient id="ink" cx="50%" cy="50%" r="70.71%"><stop stop-color="${design.color1}"/><stop offset="1" stop-color="${design.color2}"/></radialGradient>`
    : `<linearGradient id="ink" x1="0" y1="0" x2="${design.direction === 'vertical' ? '0' : '100%'}" y2="${design.direction === 'horizontal' ? '0' : '100%'}"><stop stop-color="${design.color1}"/><stop offset="1" stop-color="${design.color2}"/></linearGradient>`;
  const modules = [];
  for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) if (matrix.data[row * matrix.size + col]) modules.push(`M${col + 4} ${row + 4}h1v1h-1z`);
  let image = '';
  // Only locally rasterized PNGs are accepted; SVG cannot embed arbitrary markup/URLs.
  if (logoData && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logoData)) {
    const size = matrix.size * design.logoScale, pad = size * 0.12, xy = (total - size) / 2;
    image = `<rect x="${xy - pad}" y="${xy - pad}" width="${size + 2 * pad}" height="${size + 2 * pad}" fill="#ffffff"/><image href="${logoData}" x="${xy}" y="${xy}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 ${total} ${total}"><defs>${gradient}</defs><rect width="${total}" height="${total}" fill="#ffffff"/><rect x="4" y="4" width="${matrix.size}" height="${matrix.size}" fill="${design.background}"/><path d="${modules.join('')}" fill="url(#ink)"/>${image}</svg>`;
}
