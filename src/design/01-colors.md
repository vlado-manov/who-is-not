# Colors

## Brand Palette (Tailwind token `primary.*`)

| Token         | Hex       | Usage                          |
|---------------|-----------|-------------------------------|
| `primary-100` | `#49D0B5` | Accent teal (rare)            |
| `primary-200` | `#374EE2` | Deep blue (rare)              |
| `primary-300` | `#205E46` | Deep green (rare)             |
| `primary-400` | `#02BA1D` | Bright green (rare)           |
| `primary-500` | `#FA3A00` | Core orange-red — main brand  |
| `primary-600` | `#BA350D` | Dark orange-red               |
| `primary-700` | `#FA8900` | Warm amber                    |
| `primary-800` | `#CACA23` | Yellow-green                  |
| `primary-900` | `#C44CD7` | Purple                        |
| `customBlack-500` | `#3F3F3F` | Near-black text/UI         |

---

## Semantic Color Mapping

### Button appearances → gradient pairs

| Appearance  | `from`    | `to`      |
|-------------|-----------|-----------|
| `primary`   | `#ff711c` | `#FA3A00` |
| `secondary` | `#cc4eed` | `#e878be` |
| `tertiary`  | `#82b52f` | `#beca2c` |
| `danger`    | `#FF4D4D` | `#D91E18` |

All gradients go `start: {x:0, y:0} → end: {x:1, y:1}` (diagonal, top-left to bottom-right).

### QuestionPlate themes

| Mode    | Text      | Sub-text  | Glow      | Border-top              | Border-bottom             |
|---------|-----------|-----------|-----------|-------------------------|---------------------------|
| `light` | `#592410` | `#762a05` | `#ffd800` | `rgba(251,192,32,1)`    | `rgba(160,110,60,0.7)`    |
| `dark`  | `#f2d6c9` | `#e2a08a` | `#ff3b00` | `rgba(255,80,40,0.9)`   | `rgba(120,20,10,0.9)`     |

---

## Background Colors

Screens use `backgroundColor: "#0a0a0a"` (near-black) as the root fallback visible before the image background loads.

Safe-area containers use `backgroundColor: "transparent"` so the full-bleed image shows through.

---

## Cam Mode Colors

Defined in `src/screens/Cam/cam.constants.ts`.

| Use                         | Value                                   |
|-----------------------------|-----------------------------------------|
| Dark overlay over the camera | `rgba(0,0,0,0.75)`                     |
| Player overlay / name ribbon | player colour at `0.75` alpha / solid  |
| Player colours              | `#FA3A00` `#374EE2` `#02BA1D` `#C44CD7` `#49D0B5` `#FA8900` (existing `primary.*` tokens) |
| Caption box over the camera | `#000000` background, `#FFFFFF` text    |
| Dim over an eliminated player | `rgba(0,0,0,0.7)`                     |
| Bottom bar under the roster grid | `#000000`                          |
| Roster photo frame          | player colour, 4 px                     |

Cam Mode is styled after TikTok, not the game (`CAM_UI` / `CAM_FONT` in `cam.constants.ts`): TikTok Sans (`assets/fonts/TikTokSans`, OFL), red primary buttons, grey translucent secondary controls, a translucent text field and captions where each line sits in its own black rounded box.

| Use                         | Value                                   |
|-----------------------------|-----------------------------------------|
| Primary button, caret, shutter core | `#FE2C55`                       |
| Secondary button / tile fill, border | `rgba(120,120,128,0.36)`, `rgba(255,255,255,0.28)` |
| Light button (on colour tints) | `#FFFFFF`, label `#161823`           |
| Text field fill / placeholder | `rgba(255,255,255,0.16)` / `rgba(255,255,255,0.55)` |
| Heart-loss glow             | `rgba(255,60,20,0.55)` (same as LivesReveal) |

iOS adds a blur under the overlay; Android draws the tint only.

---

## WarmBubbles Color Families

Bubbles are drawn from warm reds, oranges, and creams. Rough palette families:

- **Reds:** `#ef4444`, `#dc2626`, `#b91c1c`, `#f87171`, `#fecaca`
- **Oranges:** `#f97316`, `#ea580c`, `#fb923c`, `#fdba74`, `#fed7aa`, `#ffedd5`
- **Yellows:** `#fbbf24`, `#facc15`, `#fde047`, `#fef08a`, `#fef9c3`, `#fffbeb`
- **Creams:** `#fff7ed`, `#fde68a`

Opacity range: `0.07` – `0.46` (each bubble is semi-transparent; never solid).

---

## Badge / Label Color

Badge chip on buttons: `backgroundColor: "#FFD966"` (golden yellow), text `#000`.

---

## Glow Colors (per context)

| Context              | Glow color                     |
|----------------------|--------------------------------|
| Primary CTA / "play" | `rgba(41,255,25,0.8)` (green) |
| Store / secondary    | inferred from shadow           |
| Question plate glow  | `#ffd800` (yellow)            |
| Avatar selection     | Per-character `#hex` color    |
| Default button glow  | `rgba(253,193,194,0.8)` (pink)|

## DeathMatch stopwatch duel

The duel screens keep the DeathMatch backdrop and add their own dark cards (`DM_UI` in `src/screens/Game/DeathMatch/dm.constants.ts`): card `rgba(28,26,40,0.92)`, dial face `#1B1D2A`, text `#F5F0E6`, gold accent `#FFD36A`, target orange `#FA8900`, closer / further `#02BA1D` / `#FF4D4D`. Screen side padding is 24 instead of the usual 48–64 so the cards and the dial have room.
