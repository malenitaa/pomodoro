# Pixel Pomodoro

Aplicación de escritorio Pomodoro con estética pixel art retro-cute. 100% offline, sin cuentas, sin backend, sin telemetría.

## Stack

- **Electron** (proceso main + preload) — sin React ni bundler, CommonJS plano.
- **React + Vite** (renderer) — JavaScript puro, sin TypeScript.
- **CSS plano + CSS Modules-style por componente** (un `.css` por componente, sin Tailwind ni librerías de UI).
- Fuente pixel **Press Start 2P**, auto-hospedada vía `@fontsource` (se empaqueta como archivo local, cero llamadas a Google Fonts en runtime).
- Sonido de notificación generado por código (`scripts/generate-chime.cjs`) — no es una muestra de audio de terceros.
- Todo el arte (vela, taza, iconos, barra de progreso) se dibuja por código: `<canvas>` para la vela/taza y grillas CSS para los iconos de 8×8. No hay PNGs de terceros; cualquier asset se puede reemplazar después por tus propios sprites en `src/assets/`.

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

scripts/generate-chime.cjs   Generador del sonido de notificación (offline)
```

## Desarrollo

```bash
npm install
npm run dev
```

Esto levanta Vite en `http://localhost:5173` y luego abre Electron apuntando a esa URL (solo en desarrollo — en producción Electron carga el `dist/index.html` empaquetado, nunca una URL remota).

## Build (macOS)

```bash
npm run build
```

Compila el renderer con Vite y empaqueta con `electron-builder` para macOS (`.dmg`, arquitecturas `arm64` y `x64`). El resultado queda en `release/`.

> Falta un ícono propio: agregá `build/icon.icns` (1024×1024) para reemplazar el ícono por defecto de Electron antes de distribuir la app.

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

4. **Content-Security-Policy estricta**, aplicada en dos capas redundantes:
   - Vía `session.defaultSession.webRequest.onHeadersReceived` en el proceso main (autoridad real).
   - Vía `<meta http-equiv="Content-Security-Policy">` en `index.html` (defensa adicional en caso de que la carga de headers falle).

   Política: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; frame-src 'none'`. `connect-src 'none'` bloquea cualquier intento de `fetch`/`XHR`/`WebSocket` — coherente con que la app no tiene ningún backend ni llamada saliente.

5. **Bloqueo total de navegación externa**: `will-navigate` cancela cualquier intento de navegar fuera de la app, y `setWindowOpenHandler` deniega toda apertura de ventana/pestaña nueva (`window.open`, `target="_blank"`, etc.), tanto en la ventana principal como en cualquier `webContents` creado (`app.on('web-contents-created', ...)`).

6. **Sin superficie de ataque innecesaria**: no se usa el módulo `remote` (deprecado y peligroso), no hay `eval` ni `new Function`, no hay `dangerouslySetInnerHTML` en el código React, y no se cargan fuentes/imágenes/audio remotos — todo el arte, la tipografía y el sonido están empaquetados localmente y se sirven desde `file://`/`self`.

7. **Cero llamadas salientes**: no hay analytics, telemetría ni auto-updater. `connect-src 'none'` en la CSP hace que cualquier intento accidental de red del renderer falle duro en vez de silenciosamente tener éxito.

8. **Persistencia sin ejecución de datos**: el store solo lee/escribe JSON plano con `JSON.parse`/`JSON.stringify` (nunca `eval`), y todo valor cargado del disco pasa por `sanitizeData` antes de usarse — un archivo de datos corrupto o manipulado a mano no puede inyectar valores fuera de rango ni tipos inesperados en la app.

## Notas de diseño

- Ventana pequeña (≈320×420), sin bordes nativos (`frame: false`), con barra de título propia dibujada en pixel art (arrastrable vía `-webkit-app-region: drag`, botones de minimizar/cerrar/pin/configuración como grillas de píxeles).
- Todas las animaciones usan pasos discretos (cambio de frame cada ~110–130 ms, no transiciones suaves) para que se sientan genuinamente "pixel", no vectoriales.
- Los sprites de la vela, la taza y los iconos son placeholders **claramente reemplazables**: son funciones puras que dibujan sobre un `<canvas>` pequeño escalado con `image-rendering: pixelated`. Para usar tus propios PNGs, alcanza con sustituir el contenido de `drawCandle`/`drawCup` (o el componente entero) por un `<img>` apuntando a tu asset en `src/assets/`.
