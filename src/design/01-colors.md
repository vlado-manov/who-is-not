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
