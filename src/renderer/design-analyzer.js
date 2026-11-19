// design-analyzer.js
// Evalua la legibilidad del QR generado: contraste (WCAG), tamano del logo,
// posicion del logo y relacion de color logo-vs-QR. Retorna un score
// (Bueno / Regular / Malo) con recomendaciones en espanol.

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

/**
 * Luminancia relativa segun la formula WCAG 2.x.
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function relativeLuminance({ r, g, b }) {
  const transform = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const R = transform(r);
  const G = transform(g);
  const B = transform(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Ratio de contraste WCAG entre dos colores. Rango: 1 (sin contraste) a 21 (maximo).
 */
function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Analiza el diseño completo de un QR y retorna:
 * {
 *   score: 'Bueno' | 'Regular' | 'Malo',
 *   contrastRatio: number,
 *   issues: string[],
 *   recommendations: string[]
 * }
 *
 * @param {Object} config
 * @param {string} config.qrColor1
 * @param {string} config.qrColor2
 * @param {string} config.bgColor1
 * @param {string} config.bgColor2
 * @param {boolean} config.hasLogo
 * @param {number} config.logoScale  (0.10 - 0.40)
 * @param {string} [config.logoPosition] 'centro' | 'esquina' (por defecto 'centro')
 */
function analyzeDesign(config) {
  const {
    qrColor1,
    qrColor2,
    bgColor1,
    bgColor2,
    hasLogo,
    logoScale = 0.22,
    logoPosition = 'centro'
  } = config;

  const issues = [];
  const recommendations = [];

  // 1. Contraste entre el color promedio del QR y el color promedio del fondo.
  const ratioStart = contrastRatio(qrColor1, bgColor1);
  const ratioEnd = contrastRatio(qrColor2, bgColor2);
  const minRatio = Math.min(ratioStart, ratioEnd);

  if (minRatio < 3) {
    issues.push('Contraste muy bajo entre el QR y el fondo.');
    recommendations.push('Usa colores mas opuestos (ej. oscuro vs claro) para mejorar la lectura del escaner.');
  } else if (minRatio < 4.5) {
    issues.push('Contraste aceptable, pero no optimo.');
    recommendations.push('Para una lectura mas confiable en lectores antiguos, aumenta el contraste por encima de 4.5:1.');
  }

  // 2. Tamano del logo
  if (hasLogo) {
    if (logoScale > 0.30) {
      issues.push('El logo ocupa una porcion muy grande del QR.');
      recommendations.push('Reduce el tamano del logo a 30% o menos para no tapar demasiados modulos del codigo.');
    } else if (logoScale > 0.25) {
      issues.push('El logo es algo grande; podria afectar la lectura en pantallas pequenas.');
      recommendations.push('Considera reducir el logo a un 20-25% para mayor compatibilidad.');
    }

    // 3. Posicion del logo
    if (logoPosition !== 'centro') {
      recommendations.push('Las esquinas del QR contienen los patrones de deteccion; verifica que el logo no las cubra.');
    }

    // 4. Color del logo vs color del QR (heuristica simple por luminancia del color principal del QR)
    const qrLum = relativeLuminance(hexToRgb(qrColor1));
    const bgLum = relativeLuminance(hexToRgb(bgColor1));
    if (Math.abs(qrLum - bgLum) < 0.05) {
      issues.push('Los colores del QR y del fondo del logo son muy similares.');
      recommendations.push('Aplica un fondo blanco solido detras del logo para separarlo visualmente del QR.');
    }
  }

  // 5. Score final
  let score = 'Bueno';
  if (minRatio < 3 || (hasLogo && logoScale > 0.30)) {
    score = 'Malo';
  } else if (issues.length > 0) {
    score = 'Regular';
  }

  if (issues.length === 0) {
    recommendations.push('El diseno actual tiene buena legibilidad. ¡Listo para escanear!');
  }

  return {
    score,
    contrastRatio: Number(minRatio.toFixed(2)),
    issues,
    recommendations
  };
}

window.DesignAnalyzer = {
  contrastRatio,
  relativeLuminance,
  hexToRgb,
  analyzeDesign
};
