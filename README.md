<div align="center">

<img src="web/public/brand/q-link.png" width="128" alt="Logotipo oficial de Q-Link" />

# 🔗 Q-Link

**Generador de códigos QR personalizados para web y escritorio**

Crea códigos QR para enlaces, texto y redes Wi-Fi. Personaliza colores, degradados y logotipos, y exporta tus diseños con facilidad.

![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Windows](https://img.shields.io/badge/Escritorio-Windows-0078D4?logo=windows11&logoColor=white)
[![Pruebas](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml/badge.svg)](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml)

[🌐 **Probar la web**](https://q-link-jet.vercel.app) · [📖 **Guía web**](web/README.md) · [💻 **Código fuente**](https://github.com/jimmyfabian26-sys/q-link) · [⚙️ **Pruebas**](https://github.com/jimmyfabian26-sys/q-link/actions/workflows/checks.yml)

**J.D DEV · Jimmy Díaz**

</div>

---

## 📑 Contenido

- [Características](#-características-principales)
- [Tecnologías y lenguajes](#️-tecnologías-utilizadas)
- [Ediciones web y escritorio](#-ediciones-del-proyecto)
- [Ejecutar la web](#-ejecutar-q-link-web)
- [Ejecutar en Windows](#️-ejecutar-q-link-en-windows)
- [Despliegue y pruebas](#️-despliegue-en-vercel)
- [Privacidad y condiciones](#-privacidad-seguridad-y-lectura)

## ✨ Características principales

| Función | Qué ofrece |
| --- | --- |
| 🔗 **Enlaces y texto** | Genera códigos QR estáticos para compartir información. |
| 📶 **Wi-Fi** | Genera QR de conexión Wi-Fi con formato y escape de caracteres adecuados. |
| 🎨 **Personalización** | Colores, degradados, paletas y logotipos propios. |
| 📥 **Exportación** | Descarga PNG (hasta 2048 px en la web) y SVG vectorial. |
| 🌓 **Tema** | Interfaz web adaptable con modos claro y oscuro. |
| 🔒 **Privacidad web** | Sin historial ni guardado de contenidos QR; el navegador solo puede conservar la preferencia de tema. |
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

## 🧭 ¿Qué edición elegir?

- **Web:** úsala desde el navegador sin instalar nada; ideal para crear y exportar códigos QR rápidamente.
- **Escritorio:** aplicación Electron para Windows con historial y presets locales.

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

Abre `http://localhost:4173`. Incluye enlaces, texto, Wi-Fi, cinco paletas, colores y degradados, logo, PNG de hasta 2048 px, SVG y tema claro/oscuro, sin historial web.

La generación ocurre en el navegador. La edición web no guarda el contenido de los QR ni ofrece historial; borra el historial local de versiones anteriores al abrirse. Únicamente puede persistir la preferencia de tema. Los pagos se abren en PayPal mediante el enlace proporcionado por el autor.

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

## 🖼️ Vista de la aplicación

La interfaz web está disponible para probar directamente: **[Abrir Q-Link Web](https://q-link-jet.vercel.app)**. El logotipo mostrado al inicio de este README es el recurso original incluido en el repositorio.

## 🎨 Identidad visual

La web y Electron utilizan el logo azul y el icono originales de Q-Link, conservando la transparencia. El encabezado, el favicon, los recursos de pantalla de inicio y el empaquetado de escritorio comparten esta identidad.

## 🔒 Privacidad, seguridad y lectura

Los indicadores de contraste orientan el diseño, pero no garantizan la lectura de todos los QR. Prueba los diseños con varios lectores antes de imprimirlos, especialmente con logos o colores claros.

Los QR son estáticos. Q-Link no les asigna vencimiento; un enlace puede dejar de funcionar si cambia o desaparece el sitio de destino. No incorpores datos personales ni redes reales a capturas o demostraciones públicas.

## 📄 Autor, estado y condiciones

**J.D DEV · Jimmy Díaz** · [GitHub](https://github.com/jimmyfabian26-sys).

El código es público para revisión. No se ha añadido una licencia propia de redistribución. Las dependencias conservan sus respectivas licencias y la distribución web incluye la de `qrcode`.
