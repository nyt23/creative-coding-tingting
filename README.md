# Berlin, As Found

<video src="media/demo.mp4" autoplay loop muted playsinline controls width="600"></video>

A creative coding module project — a plain sheet of paper, photographs
scattered across it. Drag a photo anywhere you like, or click one to
open it full-window.

Open `index.html` in a browser. Nothing to install. Dragged positions
are remembered in that browser, so the arrangement stays put on reload.

## Tech stack

Plain HTML, CSS, and vanilla JavaScript — no frameworks, no build
step. Google Fonts (Fraunces, Caveat, Space Mono, Poppins) loaded via
`@import` in `style.css`.

## Edit the content

Everything lives in **`photos.js`** — one entry per place, with the
photo, its name, a line about it, and a few display options. Leave
`src` empty to get a placeholder rectangle while you build the page.

## Controls

- **Drag** a photo to move it
- **Click** (or Enter/Space) — open it full-window
- **Esc** or click outside — close it

Respects `prefers-reduced-motion`.
