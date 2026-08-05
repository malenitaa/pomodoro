# Pixel Pomodoro

[![Descargar última versión](https://img.shields.io/github/v/release/malenitaa/pomodoro?label=descargar&color=6b46c1)](https://github.com/malenitaa/pomodoro/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](#)

**Pixel Pomodoro** es un temporizador Pomodoro gratuito para Mac, con
estética pixel art (vela y taza de té). Es una app de escritorio nativa
para **macOS**: corre en tu computadora, no necesita internet, no pide
cuentas ni datos personales, y no manda absolutamente nada a ningún
servidor — todo lo que guarda queda en tu propia máquina.

## ¿Qué necesito para instalarla?

- Una computadora con **macOS**.

Nada más. No hace falta crear ninguna cuenta, ni instalar Node ni nada técnico.

## Instalación, paso a paso

1. Andá a [Releases](https://github.com/malenitaa/pomodoro/releases) y descargá el `.dmg` correspondiente a tu Mac (`arm64` si es una Mac con chip Apple M1/M2/M3/M4, o el otro `.dmg` si es una Mac más vieja con procesador Intel — si no estás segura/o, probá primero el `arm64`).
2. Abrí el `.dmg` descargado y arrastrá **"Pixel Pomodoro"** a tu carpeta de Aplicaciones.

## La primera vez que la abrís

macOS va a mostrar un aviso tipo *"no se puede verificar el desarrollador"* o *"Apple no pudo verificar que esta app esté libre de malware"*. Esto **no significa que algo esté mal** — pasa con cualquier aplicación que no se distribuye a través de la App Store o sin pagarle a Apple por una firma digital, y este proyecto es gratuito y de código abierto, así que no tiene esa firma.

Para abrirla la primera vez:

1. Hacé **clic derecho** (o Control + clic) sobre "Pixel Pomodoro.app".
2. Elegí **Abrir**.
3. Te va a aparecer el mismo aviso, pero esta vez con un botón **Abrir**. Tocalo.

Después de esa primera vez, la app abre normal con doble clic, como cualquier otra.

## Cómo se usa

- **Iniciar / pausar**: el botón grande del medio (▶ / ⏸).
- **Reiniciar bloque**: el botón de la izquierda (↺) — vuelve el bloque actual a su duración completa.
- **Saltear**: el botón de la derecha (⏭) — pasa al siguiente bloque sin esperar a que termine.
- **Siempre visible arriba**: el ícono de chinche (📌) en la barra superior — fija la ventana por encima de las demás.
- **Configuración**: el ícono de engranaje (⚙) — ahí podés cambiar cuánto dura el foco, los descansos, cada cuántos pomodoros hay un descanso largo, y el volumen del sonido (o silenciarlo).

Mientras estás en un bloque de foco vas a ver una **velita** que se va derritiendo a medida que pasa el tiempo. Cuando el bloque termina, escuchás un sonido suave y te llega una notificación del sistema — y durante los descansos, la vela se apaga y aparece una **taza humeante** en su lugar.

Arriba a la izquierda tenés el contador de **pomodoros completados hoy**.

## Preguntas frecuentes

**¿Necesito internet para usarla?**
No. Funciona 100% sin conexión, incluso podés desactivar el wifi y no cambia nada.

**¿Manda mis datos a algún lado?**
No. La app ni siquiera puede hacerlo aunque quisiera: tiene bloqueada a nivel técnico cualquier conexión de red saliente. Todo lo que guarda (tus tiempos configurados y cuántos pomodoros hiciste) vive en un único archivo en tu computadora, en la carpeta de datos de aplicaciones de tu usuario — nadie más lo puede ver ni acceder a él de forma remota.

**¿Necesito crear una cuenta?**
No, no hay cuentas, ni login, ni nada parecido.

**¿Es gratis?**
Sí, y no tiene compras dentro de la app, publicidad, ni ningún costo oculto.

**Cerré la app a la mitad de un bloque, ¿pierdo mi progreso?**
El contador de pomodoros de hoy y tu configuración quedan guardados. El bloque que estabas corriendo en el momento de cerrar sí se reinicia la próxima vez que abras la app.

**¿Qué hago si algo no funciona como espero?**
Cerrá la app y abrila de nuevo. Si el problema persiste, revisá si hay una versión más nueva en [Releases](https://github.com/malenitaa/pomodoro/releases).

## Para desarrolladores

Requisitos: macOS, [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/malenitaa/pomodoro.git
cd pomodoro
npm install
npm run dev    # modo desarrollo, con recarga en caliente
npm test       # corre la suite de tests
npm run build  # genera el .dmg en release/
```

## ¿Te sirvió?

Si te resultó útil y querés bancar el proyecto:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## Licencia

MIT — ver [LICENSE](LICENSE).
