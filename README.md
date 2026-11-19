<div align="center">

<img src="web/public/brand/q-link.png" width="116" alt="Logotipo original de Q-Link" />

# 🔗 Q-Link

**Generador de códigos QR personalizados para web y escritorio**

Crea códigos QR para enlaces, texto y redes Wi-Fi. Personaliza colores, degradados y logotipos, y exporta tus diseños con facilidad.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Windows](https://img.shields.io/badge/Escritorio-Windows-0078D4?logo=windows11&logoColor=white)
[![Pruebas](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml/badge.svg)](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml)

[🌐 **Abrir Q-Link Web**](https://q-link-jet.vercel.app) · [📖 **Guía de la web**](web/README.md) · [💻 **Código fuente**](https://github.com/jimmyfabian26-sys/q-link)

**J.D DEV · Jimmy Díaz**

</div>

---

## ✨ Características principales

| Función | Qué ofrece |
| --- | --- |
| 🔗 **Enlaces y texto** | Genera códigos QR estáticos para compartir información. |
| 📶 **Wi-Fi** | Genera QR de conexión Wi-Fi con formato y escape de caracteres adecuados. |
| 🎨 **Personalización** | Colores, degradados, paletas y logotipos propios. |
| 📥 **Exportación** | Descarga PNG (hasta 2048 px en la web) y SVG vectorial. |
| 🌓 **Tema** | Interfaz web adaptable con modos claro y oscuro. |
| 🗂️ **Historial local** | Guardado opcional de hasta 30 QR de enlaces/texto en el navegador, sin guardar credenciales Wi-Fi. |
| 🖥️ **Escritorio** | Aplicación Electron para Windows con historial y ajustes de diseño. |

## 🛠️ Tecnologías utilizadas

| Área | Herramientas |
| --- | --- |
| **Lenguaje** | JavaScript (ES6), HTML5, CSS3 |
| **Aplicación de escritorio** | Electron 42, Node.js, electron-builder |
| **Generación y gráficos** | `qrcode`, Canvas, SVG |
| **Aplicación web** | esbuild y JavaScript del lado del navegador |
| **Pruebas** | Node.js Test Runner, `jsQR`, `@napi-rs/canvas` |
| **Integración y despliegue** | GitHub Actions, Vercel |

## 📦 Ediciones del proyecto

| Edición | Uso | Tecnologías |
|---|---|---|
| Web · `web/` | Navegador, móvil o escritorio | JavaScript, qrcode, Canvas, SVG, esbuild |
| Escritorio · raíz | Aplicación Windows con historial y presets | Electron, JavaScript, qrcode, electron-builder |

## 🌐 Ejecutar Q-Link Web

**Usar ahora:** [q-link-jet.vercel.app](https://q-link-jet.vercel.app).

```powershell
cd web
npm ci
npm test
npm run dev
```

Abre `http://localhost:4173`. Incluye enlaces, texto, Wi-Fi, cinco paletas, colores y degradados, logo, PNG de hasta 2048 px, SVG, tema claro/oscuro e historial local opcional.

La generación ocurre en el dispositivo. El historial guarda únicamente las entradas de enlace/texto que el usuario elige, y no guarda las credenciales Wi-Fi. Los pagos se abren en PayPal mediante el enlace proporcionado por el autor.

## 🖥️ Ejecutar Q-Link en Windows

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

## ☁️ Despliegue en Vercel

Importa este repositorio usando la **raíz**, sin cambiar Root Directory. El `vercel.json` raíz instala únicamente las dependencias de `web/`, ejecuta su compilación y sirve `web/dist/`. No instala Electron ni requiere claves privadas.

También puedes desplegar desde la raíz con la CLI oficial:

```powershell
npx vercel --prod
```

Consulta [la documentación de la web](web/README.md) para conocer sus funciones, pruebas y configuración del botón de PayPal.

## ✅ Comprobaciones automáticas

Cada cambio y solicitud de incorporación ejecuta el flujo [**Validar Q-Link**](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml), que comprueba la web (`npm test` y compilación) y valida la sintaxis del código de Electron.

Para ejecutar las pruebas web localmente:

```powershell
cd web
npm ci
npm test
npm run build
```

## 📁 Estructura del proyecto

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

## 🎨 Identidad visual

La web y Electron utilizan el logo azul y el icono originales de Q-Link, conservando la transparencia. El encabezado, el favicon, los recursos de pantalla de inicio y el empaquetado de escritorio comparten esta identidad.

## 🔒 Privacidad, seguridad y lectura

Los indicadores de contraste orientan el diseño, pero no garantizan la lectura de todos los QR. Prueba los diseños con varios lectores antes de imprimirlos, especialmente con logos o colores claros.

Los QR son estáticos. Q-Link no les asigna vencimiento; un enlace puede dejar de funcionar si cambia o desaparece el sitio de destino. No incorpores datos personales ni redes reales a capturas o demostraciones públicas.

## 📄 Autor, estado y condiciones

**J.D DEV · Jimmy Díaz** · [GitHub](https://github.com/jimmyfabian26-sys).

El código es público para revisión. No se ha añadido una licencia propia de redistribución. Las dependencias conservan sus respectivas licencias y la distribución web incluye la de `qrcode`.
