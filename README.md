# Q-Link · J.D DEV

Generador de códigos QR personalizados para **web y escritorio**. Crea códigos de enlaces o redes Wi-Fi y personaliza sus colores, degradados y logo. La edición web añade texto y funciona directamente en el navegador.

| Edición | Uso | Tecnologías |
|---|---|---|
| Web · `web/` | Navegador, móvil o escritorio | JavaScript, qrcode, Canvas, SVG, esbuild |
| Escritorio · raíz | Aplicación Windows con historial y presets | Electron, JavaScript, qrcode, electron-builder |

## Web

**Usar ahora:** [q-link-jet.vercel.app](https://q-link-jet.vercel.app).

```powershell
cd web
npm ci
npm test
npm run dev
```

Abre `http://localhost:4173`. Incluye enlaces, texto, Wi-Fi, cinco paletas, colores y degradados, logo, PNG de hasta 2048 px, SVG, tema claro/oscuro e historial local opcional.

La generación ocurre en el dispositivo. El historial guarda únicamente las entradas de enlace/texto que el usuario elige, y no guarda las credenciales Wi-Fi. Los pagos se abren en PayPal mediante el enlace proporcionado por el autor.

## Escritorio

Requiere Node.js 22.12 o posterior compatible con las dependencias y npm.

```powershell
npm ci
npm start
```

```powershell
npm run dev          # Abre DevTools
npm run pack         # Aplicación sin instalador
npm run build:win    # Instalador NSIS
npm run build:appx   # Paquete APPX
```

La configuración de APPX debe coincidir con la identidad y los requisitos de la cuenta de Partner Center. Este repositorio no acredita publicación en Microsoft Store.

El escritorio conserva historial local, presets y exportación PNG/SVG. Se han añadido comprobaciones del emisor IPC, bloqueado navegación remota y ventanas nuevas, y evitado guardar nuevos QR Wi-Fi en el historial. La ventana sigue utilizando `sandbox: false` para su preload actual; migrarlo a un preload empaquetado queda pendiente. No se presenta como una auditoría completa de seguridad.

## Desplegar en Vercel

Importa este repositorio usando la **raíz**, sin cambiar Root Directory. El `vercel.json` raíz instala únicamente las dependencias de `web/`, ejecuta su compilación y sirve `web/dist/`. No instala Electron ni requiere claves privadas.

También puedes desplegar desde la raíz con la CLI oficial:

```powershell
npx vercel --prod
```

Consulta [la documentación de la web](web/README.md) para conocer sus funciones, pruebas y configuración del botón de PayPal.

## Estructura

```text
web/                    Aplicación web, pruebas y configuración
main.js                 Proceso principal Electron e IPC
preload.js              Puente entre renderer y Electron
src/renderer/           Interacciones, gráficos QR y diseño del escritorio
src/assets/             Iconos y presets
electron-builder.json   Empaquetado de escritorio
vercel.json             Despliegue web desde la raíz del repositorio
.github/workflows/      Comprobaciones automáticas
```

## Lectura y privacidad

Los indicadores de contraste orientan el diseño, pero no garantizan la lectura de todos los QR. Prueba los diseños con varios lectores antes de imprimirlos, especialmente con logos o colores claros.

Los QR son estáticos. Q-Link no les asigna vencimiento; un enlace puede dejar de funcionar si cambia o desaparece el sitio de destino. No incorpores datos personales ni redes reales a capturas o demostraciones públicas.

## Autor y condiciones

**J.D DEV · Jimmy Díaz** · [GitHub](https://github.com/jimmyfabian26-sys).

El código es público para revisión. No se ha añadido una licencia propia de redistribución. Las dependencias conservan sus respectivas licencias y la distribución web incluye la de `qrcode`.
