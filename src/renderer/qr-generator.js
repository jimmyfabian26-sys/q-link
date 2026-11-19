// qr-generator.js
// Orquesta la generacion visual del QR: matriz de modulos (via preload/qrcode),
// degradado del QR, degradado del fondo, logo incrustado, zona de silencio
// (quiet zone) y esquinas redondeadas. Equivalente a update_qr() de Python,
// pero corrigiendo un bug que el port inicial heredo: faltaba el margen
// blanco estandar alrededor del QR (en Python ese margen ya venia incluido
// por el parametro border=4 de la libreria qrcode de Python).
//
// Sin esa zona de silencio, el recorte de esquinas redondeadas cortaba
// directamente los modulos del patron, deformandolo. Ahora el margen
// garantiza que el recorte de esquinas SIEMPRE caiga dentro del area blanca,
// nunca sobre un modulo.

const QR_SIZE = 350; // mismo tamano base que en Python
const QUIET_ZONE_MODULES = 4; // estandar de la especificacion QR (igual al border=4 de Python)

/**
 * Calcula las medidas base compartidas entre canvas y SVG: tamano de modulo,
 * area de datos (sin contar el margen) y el offset en px donde empieza esa area.
 */
function computeLayout(size) {
  const totalModules = size + QUIET_ZONE_MODULES * 2;
  const moduleSize = QR_SIZE / totalModules;
  const offset = QUIET_ZONE_MODULES * moduleSize;
  const dataSize = size * moduleSize;
  return { moduleSize, offset, dataSize, totalModules };
}

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Genera el lienzo final del QR: zona de silencio blanca + area de datos con
 * degradado de fondo + modulos con degradado del QR + logo opcional +
 * esquinas redondeadas (recortadas siempre dentro del margen blanco).
 * Devuelve un <canvas>.
 *
 * @param {Object} opts
 * @param {boolean[][]} opts.matrix
 * @param {number} opts.size  tamano de la matriz (modulos, sin contar margen)
 * @param {string} opts.qrColor1
 * @param {string} opts.qrColor2
 * @param {string} opts.qrGradMode
 * @param {string} opts.bgColor1
 * @param {string} opts.bgColor2
 * @param {string} opts.bgGradMode
 * @param {HTMLImageElement|null} opts.logoImage
 * @param {number} opts.logoScale  0.10 - 0.40 (relativo al area de datos)
 * @param {boolean} opts.logoWhiteBg  fondo blanco detras del logo
 * @param {number} [opts.cornerRadius]  por defecto, un valor pequeno y seguro
 */
function renderQrCanvas(opts) {
  const {
    matrix,
    size,
    qrColor1,
    qrColor2,
    qrGradMode,
    bgColor1,
    bgColor2,
    bgGradMode,
    logoImage,
    logoScale = 0.22,
    logoWhiteBg = true,
    cornerRadius = 12
  } = opts;

  const { moduleSize, offset, dataSize } = computeLayout(size);

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = QR_SIZE;
  finalCanvas.height = QR_SIZE;
  const ctx = finalCanvas.getContext('2d');

  // 1. Zona de silencio: fondo blanco solido en TODO el lienzo. Esto es lo
  //    que garantiza el "borde blanco alrededor" que pedias y, ademas, que
  //    el QR siga siendo escaneable sin importar los colores elegidos.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);

  // 2. Degradado de fondo, pero limitado SOLO al area de datos (dentro del
  //    margen blanco). Se ve en los espacios entre modulos.
  ctx.save();
  ctx.beginPath();
  ctx.rect(offset, offset, dataSize, dataSize);
  ctx.clip();
  const bgGrad = window.GradientEngine.buildGradient(ctx, QR_SIZE, QR_SIZE, bgColor1, bgColor2, bgGradMode);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(offset, offset, dataSize, dataSize);
  ctx.restore();

  // 3. Modulos del QR con su propio degradado, desplazados por el margen.
  const qrGrad = window.GradientEngine.buildGradient(ctx, QR_SIZE, QR_SIZE, qrColor1, qrColor2, qrGradMode);
  ctx.fillStyle = qrGrad;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) {
        ctx.fillRect(
          offset + col * moduleSize,
          offset + row * moduleSize,
          Math.ceil(moduleSize),
          Math.ceil(moduleSize)
        );
      }
    }
  }

  // 4. Logo centrado (tamano relativo al AREA DE DATOS, no al lienzo completo,
  //    para que el porcentaje del slider tenga sentido visual real).
  if (logoImage) {
    const logoSize = Math.round(dataSize * logoScale);
    const pad = Math.round(logoSize * 0.12) + 6;
    const haloSize = logoSize + pad * 2;
    const haloPos = Math.round((QR_SIZE - haloSize) / 2);
    const logoPos = Math.round((QR_SIZE - logoSize) / 2);

    if (logoWhiteBg) {
      ctx.save();
      ctx.fillStyle = '#ffffff';
      roundedRectPath(ctx, haloPos, haloPos, haloSize, haloSize, 8);
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(logoImage, logoPos, logoPos, logoSize, logoSize);
  }

  // 5. Esquinas redondeadas: el radio queda limitado a un valor que SIEMPRE
  //    cae dentro de la zona de silencio, nunca sobre un modulo de datos.
  const safeRadius = Math.min(cornerRadius, offset * 0.9);
  const rounded = document.createElement('canvas');
  rounded.width = QR_SIZE;
  rounded.height = QR_SIZE;
  const rCtx = rounded.getContext('2d');
  roundedRectPath(rCtx, 0, 0, QR_SIZE, QR_SIZE, safeRadius);
  rCtx.clip();
  rCtx.drawImage(finalCanvas, 0, 0);

  return rounded;
}

/**
 * Genera un SVG vectorial equivalente del QR, con la misma zona de silencio
 * blanca y el mismo criterio de seguridad para el radio de esquina.
 */
function renderQrSvg(opts) {
  const {
    matrix,
    size,
    qrColor1,
    qrColor2,
    qrGradMode,
    bgColor1,
    bgColor2,
    bgGradMode,
    logoDataUrl,
    logoScale = 0.22,
    cornerRadius = 12
  } = opts;

  const { moduleSize, offset, dataSize } = computeLayout(size);
  const safeRadius = Math.min(cornerRadius, offset * 0.9);

  const gradDirs = {
    horizontal: { x1: '0%', y1: '0%', x2: '100%', y2: '0%' },
    vertical: { x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
    diagonal: { x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
    radial: null
  };
  const bgDir = gradDirs[bgGradMode] || gradDirs.diagonal;
  const qrDir = gradDirs[qrGradMode] || gradDirs.diagonal;

  let holeRect = null;
  if (logoDataUrl) {
    const logoSize = Math.round(dataSize * logoScale);
    const pad = Math.round(logoSize * 0.12) + 6;
    const haloSize = logoSize + pad * 2;
    const haloPos = Math.round((QR_SIZE - haloSize) / 2);
    holeRect = { x: haloPos, y: haloPos, w: haloSize, h: haloSize, logoSize };
  }

  let modules = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!matrix[row][col]) continue;
      const px = offset + col * moduleSize;
      const py = offset + row * moduleSize;
      if (holeRect && px + moduleSize > holeRect.x && px < holeRect.x + holeRect.w &&
          py + moduleSize > holeRect.y && py < holeRect.y + holeRect.h) {
        continue; // hueco para el logo
      }
      modules += `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${moduleSize.toFixed(2)}" height="${moduleSize.toFixed(2)}" fill="url(#qrGrad)" />`;
    }
  }

  let logoSvg = '';
  if (holeRect && logoDataUrl) {
    const logoXY = Math.round((QR_SIZE - holeRect.logoSize) / 2);
    logoSvg = `
      <rect x="${holeRect.x}" y="${holeRect.y}" width="${holeRect.w}" height="${holeRect.h}" rx="8" fill="#ffffff" />
      <image x="${logoXY}" y="${logoXY}" width="${holeRect.logoSize}" height="${holeRect.logoSize}" href="${logoDataUrl}" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}">
  <defs>
    <linearGradient id="bgGrad" x1="${bgDir.x1}" y1="${bgDir.y1}" x2="${bgDir.x2}" y2="${bgDir.y2}">
      <stop offset="0%" stop-color="${bgColor1}" />
      <stop offset="100%" stop-color="${bgColor2}" />
    </linearGradient>
    <linearGradient id="qrGrad" x1="${qrDir.x1}" y1="${qrDir.y1}" x2="${qrDir.x2}" y2="${qrDir.y2}">
      <stop offset="0%" stop-color="${qrColor1}" />
      <stop offset="100%" stop-color="${qrColor2}" />
    </linearGradient>
    <clipPath id="roundedClip">
      <rect x="0" y="0" width="${QR_SIZE}" height="${QR_SIZE}" rx="${safeRadius}" />
    </clipPath>
    <clipPath id="dataAreaClip">
      <rect x="${offset}" y="${offset}" width="${dataSize}" height="${dataSize}" />
    </clipPath>
  </defs>
  <g clip-path="url(#roundedClip)">
    <rect x="0" y="0" width="${QR_SIZE}" height="${QR_SIZE}" fill="#ffffff" />
    <g clip-path="url(#dataAreaClip)">
      <rect x="${offset}" y="${offset}" width="${dataSize}" height="${dataSize}" fill="url(#bgGrad)" />
    </g>
    ${modules}
    ${logoSvg}
  </g>
</svg>`;
}

window.QrGenerator = {
  QR_SIZE,
  QUIET_ZONE_MODULES,
  renderQrCanvas,
  renderQrSvg
};
