# Dallas 2026 — Cinematic Hybrid Projection

Invited symposium talk (40 min): *Exhibitions and the Mission of a Natural History Museum*.

Hybrid Aquarius-style shell (scroll-snap + keyboard + fullscreen) with stage/bleed cinema, daylight editorial look, and depth-of-field / perspective settle on image beats.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Present mode

Append `?present=1` to disable mouse parallax for rock-solid live advances:

`http://localhost:5173/?present=1`

Then press **F** for fullscreen.

## Present keys

| Key | Action |
|-----|--------|
| `→` `↓` `Space` `PageDown` | Next beat |
| `←` `↑` `PageUp` | Previous |
| `Home` / `End` | First / last |
| `F` | Fullscreen toggle |
| `Enter` or `R` | Blue Wave color reveal (on that beat) |
| `[` `]` or `,` `.` | Prep-modes focus pull (on that beat) |

Bottom-left: counter + fullscreen. Bottom-right: chapter TOC. Right edge: progress dots.

## Build for projector / USB

```bash
npm run build
```

Output is in `dist/` with relative `base: './'` — open `dist/index.html` locally or copy the folder to a USB stick.

## Asset checklist

Replace SVGs in `public/images/` with final photographs (keep filenames, or update paths in `src/data/slides.ts` and `src/data/prepModes.ts`):

| File | Beat |
|------|------|
| `cabinet-1620.svg` | Title, question, cabinet, close |
| `zeolite.svg` | Zeolite case |
| `rowleyite.svg` | Rowleyite case |
| `spinel.svg` | Spinel / lithium |
| `mars-analog.svg` | Mars analogs |
| `pattern-hinge.svg` | Act I hinge |
| `unearthed-hero.svg` | Unearthed open + loans |
| `blue-wave.svg` | Color reveal |
| `preservation.svg` | Preservation |
| `provenance.svg` | Provenance hinge |
| `prep-teapot.svg` | Prep mode 1 |
| `prep-chrysanthemum.svg` | Prep mode 2 |
| `prep-turquoise.svg` | Prep mode 3 |
| `prep-ammolite.svg` | Prep mode 4 |

Speaker notes live on each slide in `src/data/slides.ts` (`notes` field). Argument source: `docs/Dallas_Symposium_Talk_Outline.md`.

## Timing guide (~40 min)

- Open + Act I research anchors: ~18 min
- Act II Unearthed + loans: ~16 min
- Synthesis + close: ~6 min

Breathe on zeolite/Lokelma, Blue Wave reveal, prep spectrum, and the closing return to 1620.
