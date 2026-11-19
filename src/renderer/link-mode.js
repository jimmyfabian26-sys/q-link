// link-mode.js
// Logica de validacion y formateo para el modo "Link" (URL/texto plano).
// Equivalente a is_valid_url() del Python original, ligeramente mas flexible
// para aceptar tambien texto libre si el usuario lo desea.

const URL_PATTERN = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

/**
 * Valida si el texto ingresado parece una URL valida.
 */
function isValidUrl(text) {
  if (!text) return false;
  return URL_PATTERN.test(text.trim());
}

/**
 * Normaliza la URL para el QR: si no tiene protocolo, se le agrega https://
 * para asegurar que los lectores de QR abran el navegador correctamente.
 */
function normalizeUrl(text) {
  const trimmed = text.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

window.LinkMode = { isValidUrl, normalizeUrl, URL_PATTERN };
