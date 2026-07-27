# Typography

## Font Families

| Tailwind class            | Font file                   | Usage                                     |
|---------------------------|-----------------------------|-------------------------------------------|
| `font-seymour`            | `SeymourOne-Regular`        | Primary display headings (h0–h5)          |
| `font-opensans`           | `OpenSans-Regular`          | Body text, labels, headlines              |
| `font-opensans-bold`      | `OpenSans-Bold`             | Bold body                                 |
| `font-opensans-extrabold` | `OpenSans-ExtraBold`        | Strong labels (h5-headline, h6)           |
| `font-messiri`            | `ElMessiri-Regular`         | Footnotes, arabic-flavored accents        |
| `font-amatic-bold`        | `AmaticSC-Bold`             | Quote variant                             |
| `font-overpass-extrabold` | `Overpass-ExtraBold`        | Open-answer display text                  |
| `font-stalinist`          | `StalinistOne-Regular`      | Special decorative (rare)                 |
| `font-alumni`             | `AlumniSansCollegiateOne`   | Special decorative (rare)                 |

Buttons use `fontFamily: "SeymourOne-Regular"` inline (not via Tailwind class).

---

## CustomText Variants

`CustomText` component (`src/components/common/CustomText.tsx`) — all sizes in dp at 390px reference width, scaled by `Math.min(1, width / 390)`.

| Variant          | Base size (dp) | Font                    | Single-line shrink |
|------------------|---------------|-------------------------|--------------------|
| `h0`             | 180           | SeymourOne              | ✓                  |
| `h1`             | 110           | SeymourOne              | ✓                  |
| `h2`             | 72            | SeymourOne              | ✓                  |
| `h2-small`       | 28            | SeymourOne              | ✓                  |
| `h2-headline`    | 56            | OpenSans                | ✓                  |
| `h3`             | 56            | SeymourOne              | ✓                  |
| `h3-headline`    | 28            | OpenSans                | ✓                  |
| `h3-small`       | 28            | SeymourOne              | ✓                  |
| `h4`             | 40            | SeymourOne              | ✓                  |
| `h4-headline`    | 32            | OpenSans-Bold           | ✓                  |
| `h5`             | 28            | SeymourOne              | ✓                  |
| `h5-headline`    | 20            | OpenSans-ExtraBold      | ✓                  |
| `h6`             | 15            | OpenSans-ExtraBold      | ✓                  |
| `h6-headline`    | 32            | OpenSans-ExtraBold      | ✓                  |
| `p`              | 16            | OpenSans                | —                  |
| `p-small`        | 12            | OpenSans-Bold           | —                  |
| `p-xsmall`       | 10            | OpenSans-Bold           | —                  |
| `label`          | 32            | OpenSans                | ✓                  |
| `footnote`       | 14            | ElMessiri               | —                  |
| `quote`          | 32            | AmaticSC-Bold           | —                  |

### Single-line shrink behavior

Heading variants set `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale: 0.32`. This means the text will never wrap — it shrinks to 32% of the declared size before truncating.

Pass `allowWrap` to opt out (e.g., multi-line question text in QuestionPlate uses `allowWrap`).

---

## Button Typography

```ts
// CustomButton
fontFamily: "SeymourOne-Regular"
color: "#fff"
textTransform: "uppercase"
textShadowColor: "rgba(0,0,0,0.35)"
textShadowOffset: { width: 0, height: 3 }
textShadowRadius: 4
```

Font size map (ButtonFontSize):
| Size token | px  |
|------------|-----|
| `xs`       | 14  |
| `sm`       | 18  |
| `md`       | 24  |
| `lg`       | 30  |
| `xl`       | 36  |

---

## Text Shadows

| Variant        | Config                                                                 |
|----------------|------------------------------------------------------------------------|
| `shadow`       | `shadowOffset: {0, 1.75}`, `shadowRadius: 0` (sharp drop)             |
| `shadowStrong` | `shadowColor: rgba(0,0,0,1)`, `shadowOffset: {0, 1}`, `radius: 0`    |

Used via props on `CustomText`: `<CustomText shadow>` or `<CustomText shadowStrong>`.

---

## Responsive Scaling

All font sizes scale linearly with screen width:

```ts
const scale = Math.min(1, width / 390); // cap at 1× for 390px+
const fontSize = Math.round(baseSize * scale) + (isTablet ? 2 : 0);
```

Tablet (`width >= 768`) adds +2dp on top of scaled size.
