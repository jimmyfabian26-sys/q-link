import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { normalizeLink, wifiContent, createMatrix, cleanDesign, analyzeContrast, newHistoryEntry, readHistory, DEFAULT_DESIGN } from '../src/core.js';
import { renderCanvas, renderSvg } from '../src/render.js';

function decode(canvas) {
  const { data, width, height } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(new Uint8ClampedArray(data), width, height)?.data;
}
test('normaliza enlaces y rechaza esquemas activos o credenciales', () => {
  assert.equal(normalizeLink(' example.com/ruta?x=1 '), 'https://example.com/ruta?x=1');
  assert.equal(normalizeLink('http://ejemplo.com'), 'http://ejemplo.com/');
  for (const input of ['javascript:alert(1)', 'data:text/html,hello', 'ftp://example.com', 'https://user:pass@example.com', 'no es url', 'https://']) assert.throws(() => normalizeLink(input));
});
test('escapa los datos Wi-Fi y conserva caracteres especiales sin quitar espacios del SSID', () => {
  assert.equal(wifiContent({ ssid: ' Mi;Red ', password: 'a:b\\c,"', hidden: true }), 'WIFI:S: Mi\\;Red ;T:WPA;P:a\\:b\\\\c\\,\\";H:true;;');
  assert.equal(wifiContent({ ssid: 'Invitados', password: 'no guardar', security: 'nopass' }), 'WIFI:S:Invitados;T:nopass;P:;H:false;;');
  assert.throws(() => wifiContent({ ssid: 'a'.repeat(33), password: '12345678' }));
  assert.throws(() => wifiContent({ ssid: 'ñ'.repeat(17), password: '12345678' }));
  assert.throws(() => wifiContent({ ssid: 'Red', password: '' }));
});
test('el historial rechaza Wi-Fi y sanea datos almacenados o corruptos', () => {
  assert.throws(() => newHistoryEntry('wifi', 'WIFI:secret', DEFAULT_DESIGN));
  assert.throws(() => newHistoryEntry('text', 'WIFI:secret', DEFAULT_DESIGN));
  const entry = newHistoryEntry('link', 'https://example.com/', { color1: 'url(javascript:x)', logoScale: 1 });
  assert.equal(entry.design.color1, DEFAULT_DESIGN.color1);
  assert.equal(entry.design.logoScale, .2);
  assert.equal(readHistory('broken').length, 0);
  assert.equal(readHistory(JSON.stringify([{ mode: 'wifi', id: 'bad', content: 'secret' }, entry])).length, 1);
  assert.equal(readHistory(JSON.stringify(Array.from({ length: 40 }, () => entry))).length, 30);
});
test('detecta colores claros o invertidos y limita diseños', () => {
  assert.equal(analyzeContrast(DEFAULT_DESIGN).level, 'good');
  assert.equal(analyzeContrast(cleanDesign({ color1: '#ffffff', color2: '#ffffff' })).level, 'poor');
  assert.equal(analyzeContrast(cleanDesign({ color1: '#ffffff', color2: '#ffffff', background: '#000000' })).level, 'poor');
  assert.equal(cleanDesign({ logoScale: -.5 }).logoScale, .1);
});
for (const [mode, content] of [
  ['link', 'https://example.com/portafolio?origen=q-link'],
  ['wifi', wifiContent({ ssid: 'Red;demo', password: 'Clave:de,prueba\\123' })],
  ['text', 'Hola, Ecuador. Un mensaje con ñ y acentos: conexión.'],
]) {
  test(`PNG ${mode}: conserva contenido en todas las resoluciones`, () => {
    const matrix = createMatrix(content);
    for (const size of [512, 1024, 2048]) assert.equal(decode(renderCanvas(createCanvas(size, size), matrix, DEFAULT_DESIGN, null, size)), content);
  });
}
for (const direction of ['diagonal', 'horizontal', 'vertical', 'radial']) {
  test(`SVG ${direction}: lectura real y quiet zone`, async () => {
    const content = 'https://example.com/qr';
    const svg = renderSvg(createMatrix(content), { ...DEFAULT_DESIGN, direction });
    const image = await loadImage(Buffer.from(svg));
    const canvas = createCanvas(1024, 1024); canvas.getContext('2d').drawImage(image, 0, 0, 1024, 1024);
    assert.equal(decode(canvas), content);
    assert.deepEqual(Array.from(canvas.getContext('2d').getImageData(0, 0, 1, 1).data), [255, 255, 255, 255]);
  });
}
test('PNG y SVG con un logo conservan lectura; SVG rechaza contenido externo', async () => {
  const logo = createCanvas(80, 40), context = logo.getContext('2d');
  context.fillStyle = '#6651cf'; context.fillRect(0, 0, 80, 40); context.fillStyle = '#ffffff'; context.font = 'bold 22px sans-serif'; context.fillText('JD', 20, 28);
  const content = 'https://example.com/q-link/logo', matrix = createMatrix(content);
  assert.equal(decode(renderCanvas(createCanvas(1024, 1024), matrix, DEFAULT_DESIGN, logo)), content);
  const svg = renderSvg(matrix, DEFAULT_DESIGN, logo.toDataURL('image/png'));
  const canvas = createCanvas(1024, 1024); canvas.getContext('2d').drawImage(await loadImage(Buffer.from(svg)), 0, 0);
  assert.equal(decode(canvas), content);
  assert.ok(!renderSvg(matrix, DEFAULT_DESIGN, 'https://host.test/a.svg').includes('<image'));
});
