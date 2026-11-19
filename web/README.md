# Q-Link Web · J.D DEV

Generador de QR para enlaces, texto y redes Wi-Fi. Funciona en el navegador y exporta PNG y SVG, con colores, degradados y logo propio.

## Funciones

- Enlaces con normalización http/https, texto y configuración Wi-Fi con escape de caracteres.
- Cinco paletas, colores personalizados, fondo y degradados lineales o radiales.
- Logos PNG/JPG de hasta 2 MB, rasterizados localmente y limitados al 20% del área QR.
- PNG de 512, 1024 y 2048 px; SVG vectorial y copia de imagen cuando el navegador lo permite.
- Historial local opcional para enlaces/texto, hasta 30 entradas, con reutilización y borrado.
- Las credenciales Wi-Fi no se guardan en el historial.
- Tema claro/oscuro, interfaz responsive, navegación por teclado y diálogos accesibles.
- Botón de aporte voluntario mediante el enlace PayPal proporcionado por el autor.

No hay backend, registro de usuarios, analítica ni solicitudes de red para generar los QR. El hosting sigue recibiendo las solicitudes normales de la página y sus recursos. El enlace de PayPal abre un servicio externo; no se procesan pagos en Q-Link.

Los QR son estáticos: Q-Link no impone vencimiento, pero el destino de un enlace puede dejar de estar disponible. El análisis de contraste es orientativo; prueba siempre la lectura al personalizar e imprimir.

## Desarrollo

Node.js 22 o posterior y npm.

```powershell
npm ci
npm test
npm run dev
```

Abre `http://localhost:4173`. El servidor de desarrollo compila al iniciar; después de editar, ejecuta `npm run build` y recarga el navegador.

## Compilación

```powershell
npm run build
```

La carpeta `dist/` contiene la web estática completa. `esbuild` empaqueta la biblioteca `qrcode`; no se utilizan CDN ni código remoto. `QRCODE-LICENSE.txt` acompaña la distribución.

## Despliegue en Vercel

Al importar el repositorio completo `jimmyfabian26-sys/q-link`, puedes mantener la raíz: su `vercel.json` instala y compila únicamente la web. Si despliegas esta carpeta por separado, utiliza Build Command: `npm run build` y Output Directory: `dist`.

También puedes desplegar desde esta carpeta con la CLI oficial:

```powershell
npx vercel --prod
```

`vercel.json` declara la salida estática y cabeceras de seguridad. No necesita variables de entorno, base de datos ni claves privadas. [Documentación oficial de despliegue](https://vercel.com/docs/cli/deploy).

## Donaciones y autor

`config.json` contiene `donationUrl` y `authorUrl`, ambos enlaces públicos HTTPS. Modifica los valores y recompila si cambia la cuenta de destino. La dirección de PayPal aparece en la propia URL de pago; no es una clave secreta. Q-Link no verifica recepción de aportes ni cobra una cantidad fija.

## Pruebas

`npm test` ejecuta 12 pruebas con `node:test`: validación de enlaces, contenido Wi-Fi, protección del historial, contraste y decodificación real de QR exportados en distintas resoluciones, degradados y logos. Las bibliotecas de canvas y decodificación solo son dependencias de desarrollo.

## Estructura

```text
index.html          Interfaz y contenido
config.json         Enlaces públicos del autor
src/app.js          Interacciones y persistencia local
src/core.js         Contenido QR, validación, contraste e historial
src/render.js       Rasterizado PNG y exportación SVG
src/style.css       Temas y diseño responsive
scripts/            Compilación y servidor de desarrollo
test/               Pruebas de contenido y lectura de QR
vercel.json         Despliegue estático y cabeceras
```

Autor: **J.D DEV · Jimmy Díaz**.
