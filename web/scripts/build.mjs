import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));
for (const key of ['donationUrl', 'authorUrl']) {
  if (typeof config[key] !== 'string') throw new Error(`${key} debe ser texto.`);
  if (config[key] && new URL(config[key]).protocol !== 'https:') throw new Error(`${key} debe usar HTTPS.`);
}
await mkdir(path.join(root, 'dist'), { recursive: true });
await cp(path.join(root, 'public'), path.join(root, 'dist'), { recursive: true });
await cp(path.join(root, 'index.html'), path.join(root, 'dist/index.html'));
await build({
  absWorkingDir: root, entryPoints: ['src/app.js'], outdir: 'dist/assets',
  bundle: true, minify: true, format: 'esm', target: ['es2022'],
  define: { __APP_CONFIG__: JSON.stringify(config) }, legalComments: 'external',
});
await cp(path.join(root, 'node_modules/qrcode/license'), path.join(root, 'dist/QRCODE-LICENSE.txt'));
await writeFile(path.join(root, 'dist/robots.txt'), 'User-agent: *\nAllow: /\n');
console.log('Q-Link Web compilado en dist/');
