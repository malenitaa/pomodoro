# Pixel Pomodoro — guía de uso

Una app de escritorio para la técnica Pomodoro, con vela y taza de té pixel art. Corre en tu computadora, no necesita internet, no pide cuentas ni datos personales, y no manda absolutamente nada a ningún servidor — todo lo que guarda queda en tu propia máquina.

## ¿Qué necesito para instalarla?

Por ahora esta app se instala compilándola vos mismo desde el código fuente (no hay todavía un instalador listo para descargar y hacer doble clic). Necesitás:

- Una computadora con **macOS**.
- Tener instalado **[Node.js](https://nodejs.org/)** (bajalo de esa página, elegí la versión "LTS", es gratis).

Nada más. No hace falta crear ninguna cuenta en ningún lado.

## Instalación, paso a paso

1. Descargá el código del proyecto (botón **Code → Download ZIP** en la página del repositorio, o `git clone` si sabés usar Git) y descomprimilo en una carpeta.
2. Abrí la app **Terminal** (está en Aplicaciones → Utilidades) y navegá hasta esa carpeta. Por ejemplo:
   ```
   cd Descargas/pomodoro
   ```
3. Instalá lo necesario (solo la primera vez):
   ```
   npm install
   ```
4. Generá la app instalable:
   ```
   npm run build
   ```
5. Cuando termina, la app queda en la carpeta `release/mac/`. Buscá **"Pixel Pomodoro.app"** y arrastrala a tu carpeta de Aplicaciones si querés tenerla ahí de forma permanente.

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
Cerrá la app y abrila de nuevo. Si el problema persiste, revisá si hay una versión más nueva del proyecto disponible.
