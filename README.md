# Pixel Pomodoro

[![Descargar última versión](https://img.shields.io/github/v/release/malenitaa/pomodoro?label=descargar&color=6b46c1)](https://github.com/malenitaa/pomodoro/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](#)

**Pixel Pomodoro** es una app de escritorio gratuita y de código abierto para
**macOS** que implementa la **técnica Pomodoro** (temporizador de foco y
descansos) con una estética **pixel art** retro-cute: una velita que se va
derritiendo mientras trabajás y una taza de té humeante en los descansos.
Es un **timer de productividad 100% offline** — sin cuentas, sin backend,
sin telemetría, sin anuncios — construida con Electron y React.

> Este README es la documentación **técnica** (para quien va a tocar el código). Si solo querés descargarla y usarla, mirá **[USO.md](./USO.md)**.

## Stack

- **Electron** (proceso main + preload) — sin React ni bundler, CommonJS plano.
- **React + Vite** (renderer) — JavaScript puro, sin TypeScript.
- **CSS plano + CSS Modules-style por componente** (un `.css` por componente, sin Tailwind ni librerías de UI).
- Fuente pixel **Press Start 2P**, auto-hospedada vía `@fontsource` (se empaqueta como archivo local, cero llamadas a Google Fonts en runtime).
- Sonido de notificación generado por código (`scripts/generate-chime.cjs`) — no es una muestra de audio de terceros.
- Todo el arte (vela, taza, iconos, barra de progreso) se dibuja por código: `<canvas>` para la vela/taza y grillas CSS para los iconos de 8×8. No hay PNGs de terceros; cualquier asset se puede reemplazar después por tus propios sprites en `src/assets/`.

## Arquitectura

Dos procesos separados, como en cualquier app Electron, con una frontera deliberadamente angosta entre ambos:

```
PROCESO MAIN (Node.js) — electron/main.js
  ├─ timer.js        motor del pomodoro (state machine, timestamps reales)
  ├─ store.js        lee/escribe pomodoro-data.json
  └─ validators.js   valida todo lo que llega por IPC

        │  eventos main -> renderer (webContents.send)
        │    timer:state          (cada 250ms mientras corre)
        │    timer:blockComplete  (al terminar un bloque)
        ▼
   electron/preload.js — contextBridge.exposeInMainWorld("pomodoro", {...})
        ▲
        │  comandos renderer -> main (ipcRenderer.invoke)
        │    timer.start / pause / reset / skip
        │    settings.get / settings.update
        │    window.minimize / close / setAlwaysOnTop
        │
PROCESO RENDERER (Chromium) — React, src/
  ├─ App.jsx                 arma la pantalla a partir del estado que llega
  ├─ hooks/useTimer.js        se suscribe a timer:state / timer:blockComplete
  ├─ hooks/useSettings.js     pide/actualiza settings vía IPC
  └─ components/Candle,TeaCup,ProgressBar,...   dibujan ese estado (canvas/CSS)
```

Puntos clave de esta división:

- **La única verdad sobre el tiempo restante vive en el proceso main.** `timer.js` calcula `remaining = duración - (Date.now() - inicio)` en cada tick y lo empuja al renderer. El renderer nunca cuenta el tiempo por su cuenta — solo pinta el número que le llega. Así, si la ventana está minimizada o la máquina durmió, no hay nada que "se desincronice": el próximo tick recalcula desde el timestamp real.
- **El renderer no puede hablarle a nada del proceso main salvo por las funciones que `preload.js` decide exponer** (ver "Decisiones de seguridad" más abajo). No hay acceso a Node, ni a `ipcRenderer` crudo, ni una forma de invocar un canal que no esté en esa lista.
- **La persistencia es un detalle interno de main.** El renderer nunca toca el filesystem — pide `settings:get`/`stats:get` y listo. `store.js` es el único módulo que lee/escribe `pomodoro-data.json`.
- **`App.jsx` es básicamente una función de `estado del timer → pixeles`.** No guarda su propio timer, no persiste nada directamente: todo el estado real vive en main y llega vía los hooks `useTimer`/`useSettings` suscriptos a los eventos de `preload.js`.

## Estructura del proyecto

```
electron/              Proceso main y preload (CommonJS, sin bundler)
  main.js               Ventana, CSP, bloqueo de navegación, IPC
  preload.js             contextBridge: única puerta renderer -> main
  validators.js          Validación/sanitización de todo payload IPC
  store.js               Persistencia JSON con escritura atómica
  timer.js               Motor del pomodoro basado en timestamps reales

src/                    Renderer (React + Vite)
  components/            TitleBar, Candle, TeaCup, ProgressBar, Controls, Settings...
  hooks/                  useTimer, useSettings, useBlockCompleteSound
  assets/sounds/          chime.wav (generado localmente)
  styles/                 Paleta de colores y estilos globales

tests/                 Suite de tests (node --test, sin dependencias extra)
  store.test.cjs         Escritura atómica, recuperación de corrupción, saneo
  validators.test.cjs    Cada caso de aceptación/rechazo de IPC, incluida inyección de __proto__
  timer.test.cjs         Ciclo de fases, pausa/resume, semántica de skip

scripts/generate-chime.cjs   Generador del sonido de notificación (offline)
scripts/generate-icon.cjs    Generador del ícono de la app (offline)
build/icon.png                Ícono fuente (1024×1024) usado por electron-builder
```

## Tests

```bash
npm test
```

Corre con el test runner nativo de Node (`node --test`, sin Jest/Mocha/dependencias extra) contra `electron/store.js`, `electron/validators.js` y `electron/timer.js` — la lógica que importa que sea correcta y no dependa de tener una ventana abierta. Cubre, entre otras cosas: que la escritura atómica nunca deje un `.tmp` huérfano, que un archivo de datos corrupto recupere a defaults sin tirar excepción, que el saneo descarte claves desconocidas y tipos inválidos, que la validación de IPC rechace un intento de contaminar `Object.prototype` vía `__proto__`, y que pausar/resumir el timer preserve el tiempo restante exacto.

## Cómo correrlo/compilarlo vos mismo, paso a paso

Cualquiera con el código fuente puede levantarlo sin depender de nada externo (no hace falta ninguna cuenta, API key, ni servicio de terceros):

1. Instalá [Node.js](https://nodejs.org/) 18 o superior (incluye `npm`).
2. Clonate o descargá este repositorio.
3. Instalá las dependencias:
   ```bash
   npm install
   ```
4. **Para desarrollar** (recarga en caliente):
   ```bash
   npm run dev
   ```
   Esto levanta Vite en `http://localhost:5173` y abre Electron apuntando a esa URL. Solo en este modo la app habilita DevTools y relaja mínimamente la CSP para que el propio HMR de Vite funcione (ver sección de seguridad) — la app empaquetada nunca hace esto.
5. **(Opcional) correr los tests**:
   ```bash
   npm test
   ```
6. **Para generar la app instalable** (macOS):
   ```bash
   npm run build
   ```
   Compila el renderer con Vite y empaqueta con `electron-builder` (`.dmg`, arquitecturas `arm64` y `x64`). El resultado queda en `release/`. En producción, Electron carga siempre el `dist/index.html` empaquetado desde disco — nunca una URL remota.

El ícono (`build/icon.png`, 1024×1024, un tomatito pixel art sobre una placa violeta) también está generado por código — ver `scripts/generate-icon.cjs` — y `electron-builder` genera automáticamente el `.icns`/`.ico`/PNGs de todos los tamaños necesarios a partir de ese archivo. Si querés reemplazarlo por tu propio arte, alcanza con sobrescribir `build/icon.png` (mínimo 512×512, idealmente 1024×1024).

> **Nota sobre macOS y Gatekeeper**: este build no está firmado con un certificado de Apple Developer ni notarizado (eso requiere una cuenta de pago de Apple, fuera del alcance de "gratis de mantener para siempre"). Si compilás la app en tu propia máquina y la abrís ahí, macOS normalmente no pone problema. Si en cambio la movés a otra Mac (o la compartís), esa Mac va a mostrar "no se puede verificar el desarrollador" la primera vez — es el aviso estándar de Gatekeeper para cualquier app sin firmar, no un indicio de malware. Se resuelve haciendo clic derecho → **Abrir** la primera vez.

## Persistencia (sin base de datos)

Toda la configuración y las estadísticas viven en un único archivo JSON:

```
<userData>/pomodoro-data.json
```

(`userData` es la carpeta estándar de Electron por SO, p. ej. `~/Library/Application Support/Pixel Pomodoro` en macOS).

- **Escritura atómica**: cada guardado escribe primero a un archivo temporal (`pomodoro-data.json.<pid>.tmp`) y luego hace `rename` sobre el archivo final. Un `rename` en el mismo filesystem es atómico a nivel de SO, así que un cierre a mitad de escritura nunca puede dejar el archivo corrupto a medias.
- **Recuperación ante corrupción**: si el archivo no existe, no se puede leer o el JSON es inválido, la app arranca con los valores por defecto sin crashear (`electron/store.js#loadData`).
- **Saneo de datos**: al cargar, cualquier clave desconocida o de tipo incorrecto se descarta silenciosamente en vez de propagarse (`sanitizeData`).
- **Qué se guarda**: duración de foco/descanso corto/descanso largo, pomodoros antes del descanso largo, volumen, silencio, "siempre visible arriba", posición/tamaño de ventana, y un contador de pomodoros completados por día (se conservan solo los últimos 30 días; las claves más viejas se descartan en cada guardado).

## Funcionalidad

- Ciclo clásico configurable: foco (25 min por defecto), descanso corto (5), descanso largo (15), descanso largo cada 4 pomodoros.
- Controles: iniciar, pausar, reiniciar el bloque actual, saltear al siguiente bloque (saltear no cuenta el bloque como completado ni dispara sonido/notificación).
- Al completar un bloque de foco: sonido local corto (silenciable) + notificación nativa del SO, y se suma al contador de "pomodoros de hoy".
- El timer vive en el **proceso main** y calcula el tiempo restante como `duración - (Date.now() - inicio)` en cada tick, en vez de decrementar un contador con `setInterval`. Esto evita desincronización si la máquina se suspende o la ventana se minimiza: al despertar, el próximo tick recalcula desde el timestamp real.
- Vela pixel central: la cera baja a medida que avanza el bloque de foco, la llama titila con 3 frames a ~9 fps (se congela en pausa). En los descansos, la vela se apaga y aparece una taza pixel humeante con steam animado en 3 frames.
- Barra de progreso pixel con marcador que se desplaza según el % del bloque actual.
- Panel de configuración para duraciones, cantidad de pomodoros antes del descanso largo, volumen y silencio.

## Decisiones de seguridad

Este proyecto trata la seguridad como requisito no negociable, no como algo opcional:

1. **Aislamiento total del renderer**: `BrowserWindow` se crea con `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` y `webSecurity: true` (`electron/main.js`). El renderer nunca tiene acceso directo a Node.js ni a los módulos internos de Electron.

2. **Superficie IPC mínima y explícita**: `electron/preload.js` expone únicamente un objeto `window.pomodoro` con funciones nombradas y de propósito específico (`timer.start()`, `settings.update()`, `window.minimize()`, etc.) vía `contextBridge.exposeInMainWorld`. **Nunca** se expone `ipcRenderer` completo ni un `invoke(channel, ...args)` genérico — el renderer no puede invocar canales arbitrarios del proceso main.

3. **Validación estricta en el proceso main**: cada handler de IPC que recibe datos (`electron/validators.js`) valida el *shape* completo del payload — claves conocidas, tipos correctos, rangos numéricos válidos — y **rechaza (lanza error) todo el payload** si algo no matchea, en vez de sanear parcialmente o aceptar datos con forma inesperada.

4. **Content-Security-Policy estricta**, aplicada vía `session.defaultSession.webRequest.onHeadersReceived` en el proceso main:

   `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'`

   `connect-src 'none'` bloquea cualquier intento de `fetch`/`XHR`/`WebSocket` — coherente con que la app no tiene ningún backend ni llamada saliente. Esta política estricta es la que se aplica siempre en la app empaquetada (`npm run build`). En `npm run dev` se relaja únicamente lo indispensable para que el propio cliente de Vite (HMR) funcione contra `http://localhost:5173` — el resto de las reglas se mantiene igual, y esa relajación nunca ocurre en producción.

5. **Bloqueo total de navegación externa**: `will-navigate` cancela cualquier intento de navegar fuera de la app, y `setWindowOpenHandler` deniega toda apertura de ventana/pestaña nueva (`window.open`, `target="_blank"`, etc.), tanto en la ventana principal como en cualquier `webContents` creado (`app.on('web-contents-created', ...)`).

6. **Sin superficie de ataque innecesaria**: no se usa el módulo `remote` (deprecado y peligroso), no hay `eval` ni `new Function`, no hay `dangerouslySetInnerHTML` en el código React, y no se cargan fuentes/imágenes/audio remotos — todo el arte, la tipografía y el sonido están empaquetados localmente y se sirven desde `file://`/`self`.

7. **Cero llamadas salientes**: no hay analytics, telemetría ni auto-updater. `connect-src 'none'` en la CSP hace que cualquier intento accidental de red del renderer falle duro en vez de silenciosamente tener éxito.

8. **Persistencia sin ejecución de datos**: el store solo lee/escribe JSON plano con `JSON.parse`/`JSON.stringify` (nunca `eval`), y todo valor cargado del disco pasa por `sanitizeData` antes de usarse — un archivo de datos corrupto o manipulado a mano no puede inyectar valores fuera de rango ni tipos inesperados en la app.

9. **Sin menú ni DevTools en producción**: la app empaquetada corre con `Menu.setApplicationMenu(null)` — desaparecen "Reload", "Force Reload" y "Toggle Developer Tools" (y sus atajos de teclado) del menú por defecto de Electron. Si algo intentara abrir DevTools igual, `devtools-opened` lo cierra al toque. En desarrollo (`npm run dev`) el menú y DevTools quedan disponibles normalmente, porque ahí sí hacen falta para debuggear.

10. **Errores que nunca crashean el proceso ni exponen rutas**: `electron/store.js#saveData` (y todo lo que la llama) está envuelto en un `try/catch` propio — si el disco está lleno o hay un problema de permisos, esa escritura puntual se pierde pero la app sigue corriendo; nunca hay un crash con diálogo de error mostrando una ruta absoluta del sistema. Además, verificamos en la práctica (no solo en teoría) qué le llega al renderer cuando un handler de IPC lanza una excepción: Electron solo reenvía el `message` del error, nunca el stack trace ni nada del proceso main — y como esos mensajes son siempre los que nosotros mismos escribimos en `validators.js` (ej. `"focusMin" must be between 1 and 180`), jamás hay una ruta de archivo, nombre de usuario del SO, ni detalle interno en lo que el renderer puede llegar a ver.

## Auditoría de dependencias

`npm audit` reporta vulnerabilidades (algunas críticas) — pero **todas** están en la cadena de herramientas de *build* (`electron-builder`, `@electron/rebuild` y sus dependencias transitivas como `tar`/`node-gyp`), nunca en el código que termina empaquetado en la app. Las únicas dependencias de runtime (`dependencies` en `package.json`, lo único que entra al `app.asar`) son `react`, `react-dom` y `@fontsource/press-start-2p` — cero vulnerabilidades reportadas ahí. `npm audit fix` (sin `--force`) no resuelve nada porque el fix real implica un salto de versión mayor de `electron-builder`; no lo forzamos unilateralmente porque podría romper el empaquetado ya verificado — es un cambio a evaluar a propósito, no algo para aplicar a ciegas.

## ¿Pasaría un chequeo tipo OWASP Top 10?

Mapeo honesto contra OWASP Top 10 (2021), interpretado para una app de escritorio offline de un solo usuario (varias categorías del Top 10 están pensadas para apps web multiusuario con servidor, y acá directamente no aplican por diseño):

| Categoría | Estado | Motivo |
|---|---|---|
| A01 Broken Access Control | N/A | No hay usuarios, cuentas ni recursos multiusuario que proteger. |
| A02 Cryptographic Failures | N/A | No se maneja ni transmite información sensible (solo duración de timers y contadores). |
| A03 Injection | ✅ | Sin `eval`, sin shell, sin SQL. IPC valida tipos/rangos/claves con whitelist estricta, incluido rechazo de un intento de `__proto__` (ver `tests/validators.test.cjs`). |
| A04 Insecure Design | ✅ | Superficie de ataque mínima por diseño: sin red, sin backend, IPC explícito y acotado. |
| A05 Security Misconfiguration | ✅ | `contextIsolation`/`sandbox`/`nodeIntegration:false`, CSP estricta, sin menú/DevTools en producción. |
| A06 Vulnerable Components | ⚠️ | Ver "Auditoría de dependencias" arriba — vulnerabilidades reales, pero acotadas a herramientas de build, no al código shipeado. |
| A07 Auth Failures | N/A | No hay autenticación por diseño (sin cuentas). |
| A08 Software/Data Integrity Failures | ✅ | Sin auto-updater (se elimina toda una clase de riesgo de supply-chain), sin ejecución de código remoto. Pendiente si se distribuye a terceros: firma de código/notarización de Apple (ver nota de Gatekeeper). |
| A09 Logging/Monitoring Failures | N/A por diseño | No hay telemetría intencionalmente (privacidad); no aplica el concepto de "falta de logging" a una app local de un solo usuario. |
| A10 SSRF | N/A | No hay ningún request saliente posible — `connect-src 'none'` lo bloquea a nivel de motor. |

No es una certificación formal (esto no reemplaza un pentest/análisis de terceros), pero para el perfil de riesgo real de esta app — sin red, sin datos sensibles, sin multiusuario — no hay hallazgos pendientes fuera de lo ya documentado en A06.

## Notas de diseño

- Ventana pequeña (≈320×420), sin bordes nativos (`frame: false`), con barra de título propia dibujada en pixel art (arrastrable vía `-webkit-app-region: drag`, botones de minimizar/cerrar/pin/configuración como grillas de píxeles).
- Todas las animaciones usan pasos discretos (cambio de frame cada ~110–130 ms, no transiciones suaves) para que se sientan genuinamente "pixel", no vectoriales.
- Los sprites de la vela, la taza y los iconos son placeholders **claramente reemplazables**: son funciones puras que dibujan sobre un `<canvas>` pequeño escalado con `image-rendering: pixelated`. Para usar tus propios PNGs, alcanza con sustituir el contenido de `drawCandle`/`drawCup` (o el componente entero) por un `<img>` apuntando a tu asset en `src/assets/`.
