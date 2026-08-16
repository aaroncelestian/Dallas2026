# Dallas 2026 — Cinematic Hybrid Projection

Invited symposium talk (40 min): *Exhibitions and the Mission of a Natural History Museum*.

Dark-room cinema: specimens on a black stage, one line of type, the argument in your voice. Scroll-snap + keyboard + fullscreen.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Stage window (Zoom)

Do **not** use browser fullscreen — Zoom keeps sharing the old window and the slides freeze.

From the rehearsal tab, press **P** (or click **Stage**). That opens a chrome-less window for Zoom. Share **that window**. The slide index and Resources stay available on hover.

Or, with the server already running:

```bash
npm run stage
```

That launches Chrome/Edge as an app window (`--app`), which is the cleanest share.

## Present keys

| Key | Action |
|-----|--------|
| `→` `↓` `Space` `PageDown` | Next beat |
| `←` `↑` `PageUp` | Previous |
| `Home` / `End` | First / last |
| `P` | Open stage window (share this in Zoom) |
| `Esc` or `P` again | Leave stage / close the stage window |
| Print button | Speaker script — copy for an AI, or print / save as PDF |
| `Shift+F` | Native fullscreen (breaks Zoom window-share) |
| `H` | Lokelma H/K exchange: K in → H pointing → bend/leave → locked |
| `[` `]` or `,` `.` | Prep-modes focus pull (on that beat) |
| Space / → | Next scene beat, then next slide |
| ← | Previous scene beat, then previous slide |
| `1`–`9` | Jump to scene beat N |
| Drag | Orbit the Lokelma structure or the rowleyite void (on those beats) |
| Hover counter | Jump to a slide or a scene beat |

Chrome (counter, TOC, Resources) stays invisible until you hover. Cursor hides after a beat of stillness. The counter opens a slide list. Resources open over the talk — **Back to talk** or Esc returns.

## Build for projector / USB

```bash
npm run build
```

Output is in `dist/` with relative `base: './'` — open `dist/index.html` locally or copy the folder to a USB stick.

## How to play it

The screen holds the specimen and a sentence. Everything else is in `notes` on each beat in `src/data/slides.ts`. Hold the cold open. Hold Blue Wave. Hold the closing aquamarine.

Argument source: `docs/Dallas_Symposium_Talk_Outline.md`.

## Photographs

Studio and gallery frames from `original_images/` are compressed into `public/images/`:

| File | Beat |
|------|------|
| `gold.jpg` | Cold open, title |
| `aquamarine.jpg` | Close |
| `zeolite.jpg` | Lokelma · porous mineral |
| `spinel.jpg` | Lithium |
| `rowleyite.jpg` | Rowleyite |
| `stone-polish.jpg` | Kidney stone cut |
| `ks78-cut.jpg` | Kidney stone CT poster |
| `ks78-thickness.mp4` | Kidney stone CT orbit |
| `stromatolite.jpg` | Stromatolite thin section |
| `stone-biofilm.jpg` | Stone biofilm SEM · colony |
| `stone-voids.jpg` | Stone biofilm SEM · voids |
| `halite-trona.jpg` | Salt as shelter |
| `mars-analog.jpg` | Salt and Mars |
| `emerald.jpg` | Unearthed |
| `bluecap.jpg` | Blue Cap · criteria |
| `blue-wave.jpg` | Blue Wave · water and crystallization |
| `stibnite.jpg` | Preservation |
| `fluorite.jpg` | Provenance |
| `tourmaline.jpg` | Peninsular Ranges |
| `unearthed-gallery.jpg` | Loans |
| `prep-teapot.jpg` | Prep mode 1 |
| `prep-chrysanthemum.jpg` | Prep mode 2 |
| `prep-malachite.jpg` | Prep mode 3 · malachite feet |
| `prep-ammolite.jpg` | Prep mode 4 · thumb |
| `prep-ammolite.mp4` | Prep mode 4 · swimming reconstruction |

1620 is typographic on purpose.

## Timing guide (~40 min)

- Open + Act I research anchors: ~18 min
- Act II Unearthed + loans: ~16 min
- Return + close: ~6 min

Breathe on the cold open, porous mineral/Lokelma structure, Blue Wave, prep spectrum, and the closing aquamarine.

Regenerate the Lokelma atoms or the rowleyite void mesh after CIF changes:

```bash
npm run parse-cif
```
