// wifi-mode.js
// Logica del modo "Red WiFi": construye la cadena de texto estandar que los
// lectores de QR de Android/iOS interpretan para conectarse automaticamente
// a una red inalambrica.
// Formato estandar:  WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<password>;;

/**
 * Escapa caracteres especiales reservados por el estandar WIFI-QR
 * (; , : \ ) anteponiendo una barra invertida, segun la especificacion.
 */
function escapeWifiField(value) {
  return String(value).replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Construye la cadena WIFI: a partir de los datos del formulario.
 * @param {Object} data
 * @param {string} data.ssid
 * @param {string} data.password
 * @param {'WPA'|'WEP'|'nopass'} data.security
 * @param {boolean} [data.hidden]
 */
function buildWifiString({ ssid, password, security, hidden }) {
  const s = escapeWifiField(ssid || '');
  const t = security === 'nopass' ? 'nopass' : security;
  const p = security === 'nopass' ? '' : escapeWifiField(password || '');
  const h = hidden ? 'true' : 'false';
  return `WIFI:S:${s};T:${t};P:${p};H:${h};;`;
}

/**
 * Valida los campos minimos requeridos del formulario WiFi.
 * Retorna { valid: boolean, errors: string[] }
 */
function validateWifiForm({ ssid, password, security }) {
  const errors = [];
  if (!ssid || !ssid.trim()) {
    errors.push('El nombre de la red (SSID) es obligatorio.');
  }
  if (security !== 'nopass' && (!password || password.length === 0)) {
    errors.push('La contraseña es obligatoria para redes WPA/WPA2 o WEP.');
  }
  if (security === 'WEP' && password && password.length < 5) {
    errors.push('Las contraseñas WEP suelen requerir al menos 5 caracteres.');
  }
  return { valid: errors.length === 0, errors };
}

window.WifiMode = { buildWifiString, validateWifiForm, escapeWifiField };
