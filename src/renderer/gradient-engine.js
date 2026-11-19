// gradient-engine.js
// Motor de degradados portado desde la logica Python (generate_grad).
// En Python se pintaba pixel a pixel con PIL; aqui usamos los gradientes
// nativos de Canvas 2D, que son mucho mas eficientes pero producen un
// resultado visualmente equivalente (diagonal / vertical / horizontal).

/**
 * Convierte un color hexadecimal (#rrggbb) a un objeto {r,g,b}.
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

/**
 * Pinta un degradado de tipo lineal o radial dentro de un contexto 2D.
 * Equivalente directo del metodo generate_grad() del Python original:
 *   - "horizontal": de izquierda a derecha
 *   - "vertical": de arriba a abajo
 *   - "diagonal": de la esquina superior-izquierda a la inferior-derecha
 *   - "radial": NUEVO, no existia en Python; degradado desde el centro
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {string} c1 color inicial (#rrggbb)
 * @param {string} c2 color final (#rrggbb)
 * @param {string} mode 'horizontal' | 'vertical' | 'diagonal' | 'radial'
 * @returns {CanvasGradient}
 */
function buildGradient(ctx, w, h, c1, c2, mode) {
  let grad;
  switch (mode) {
    case 'horizontal':
      grad = ctx.createLinearGradient(0, 0, w, 0);
      break;
    case 'vertical':
      grad = ctx.createLinearGradient(0, 0, 0, h);
      break;
    case 'radial':
      grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.4);
      break;
    case 'diagonal':
    default:
      grad = ctx.createLinearGradient(0, 0, w, h);
      break;
  }
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  return grad;
}

/**
 * Dibuja un rectangulo de degradado completo en un canvas off-screen y
 * devuelve el ImageData resultante (equivalente al objeto PIL Image de Python).
 */
function generateGradientImageData(w, h, c1, c2, mode) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = buildGradient(ctx, w, h, c1, c2, mode);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Genera un string de CSS background (linear-gradient/radial-gradient) para
 * usarlo directamente en el fondo de la ventana/app, fuera del canvas.
 */
function cssGradient(c1, c2, mode) {
  switch (mode) {
    case 'horizontal':
      return `linear-gradient(90deg, ${c1}, ${c2})`;
    case 'vertical':
      return `linear-gradient(180deg, ${c1}, ${c2})`;
    case 'radial':
      return `radial-gradient(circle at center, ${c1}, ${c2})`;
    case 'diagonal':
    default:
      return `linear-gradient(135deg, ${c1}, ${c2})`;
  }
}

window.GradientEngine = {
  hexToRgb,
  buildGradient,
  generateGradientImageData,
  cssGradient
};
