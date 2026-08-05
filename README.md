# Pixel Pomodoro

[![Download latest release](https://img.shields.io/github/v/release/malenitaa/pomodoro?label=download&color=6b46c1)](https://github.com/malenitaa/pomodoro/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey)](#)

**Pixel Pomodoro** is a free Pomodoro timer for Mac with a pixel-art
look (a melting candle and a steaming teacup). It's a native **macOS**
desktop app: it runs on your computer, doesn't need the internet,
doesn't ask for accounts or personal data, and sends absolutely nothing
to any server — everything it stores stays on your own machine.

## What do I need to install it?

- A **macOS** computer.

That's it. No account needed, no Node install, nothing technical.

## Installation, step by step

1. Go to [Releases](https://github.com/malenitaa/pomodoro/releases) and download the `.dmg` for your Mac (`arm64` if it's a Mac with an Apple M1/M2/M3/M4 chip, or the other `.dmg` if it's an older Intel Mac — if you're not sure, try `arm64` first).
2. Open the downloaded `.dmg` and drag **"Pixel Pomodoro"** to your Applications folder.

## The first time you open it

macOS will show a warning like *"cannot verify the developer"* or *"Apple could not verify this app is free of malware."* This **doesn't mean anything is wrong** — it happens with any app not distributed through the App Store or without paying Apple for a developer signature, and this project is free and open source, so it doesn't have that signature.

To open it the first time:

1. **Right-click** (or Control + click) on "Pixel Pomodoro.app".
2. Choose **Open**.
3. You'll see the same warning again, but this time with an **Open** button. Click it.

After that first time, the app opens normally with a double-click, like any other.

## How to use it

- **Start / pause**: the big button in the middle (▶ / ⏸).
- **Restart block**: the left button (↺) — resets the current block to its full duration.
- **Skip**: the right button (⏭) — moves to the next block without waiting for it to finish.
- **Always on top**: the pin icon (📌) at the top — keeps the window above others.
- **Settings**: the gear icon (⚙) — change how long focus/break blocks last, how many pomodoros before a long break, and the sound volume (or mute it).

While you're in a focus block, you'll see a **little candle** melt down as time passes. When the block ends, you'll hear a soft sound and get a system notification — and during breaks, the candle goes out and a **steaming cup** appears in its place.

Top left shows the counter for **pomodoros completed today**.

## FAQ

**Do I need internet to use it?**
No. It works 100% offline — you can even turn off wifi and nothing changes.

**Does it send my data anywhere?**
No. The app couldn't even if it wanted to: any outgoing network connection is blocked at a technical level. Everything it stores (your configured durations and how many pomodoros you did) lives in a single file on your computer, in your user's application data folder — no one else can see it or access it remotely.

**Do I need to create an account?**
No, there are no accounts, no login, nothing like that.

**Is it free?**
Yes, and it has no in-app purchases, ads, or hidden costs.

**I closed the app halfway through a block — do I lose my progress?**
Today's pomodoro counter and your settings are saved. The block that was running when you closed it does reset the next time you open the app.

**What do I do if something isn't working as expected?**
Close the app and reopen it. If the problem persists, check if there's a newer version in [Releases](https://github.com/malenitaa/pomodoro/releases).

## For developers

Requirements: macOS, [Node.js](https://nodejs.org/) 18+.

```bash
git clone https://github.com/malenitaa/pomodoro.git
cd pomodoro
npm install
npm run dev    # dev mode, with hot reload
npm test       # runs the test suite
npm run build  # builds the .dmg into release/
```

## Enjoyed it?

If this was useful and you'd like to support the project:

- [Cafecito](https://cafecito.app/rezamalena)
- [Ko-fi](https://ko-fi.com/malenitaa)

## License

MIT — see [LICENSE](LICENSE).
