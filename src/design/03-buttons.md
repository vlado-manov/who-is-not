# Buttons

All buttons use `CustomButton` (`src/components/common/CustomButton.tsx`).

---

## Variants

### `default` (rounded rectangle)
- `borderRadius: 20`
- Standard for all primary/secondary/tertiary CTAs

### `pill`
- `borderRadius: 999`
- Full-pill shape, used for language selectors and small utility buttons

### `circle`
- `borderRadius: diameter / 2`
- Fixed circular button; `diameter` prop controls size (default `180`)

---

## Appearances (gradient presets)

| Appearance  | Gradient from → to     | Use case                          |
|-------------|------------------------|-----------------------------------|
| `primary`   | `#ff711c` → `#FA3A00`  | Main CTA ("PLAY", "IT'S ME")      |
| `secondary` | `#cc4eed` → `#e878be`  | Store, premium actions            |
| `tertiary`  | `#82b52f` → `#beca2c`  | Rulebook, avatar name labels      |
| `danger`    | `#FF4D4D` → `#D91E18`  | Destructive / exit actions        |
| `custom`    | via `gradientColors`   | Arbitrary [from, to] pair         |

The gradient always goes diagonal: `{x:0,y:0} → {x:1,y:1}`.

---

## Background Override Options

Priority order (first match wins):

1. `backgroundImage` — ImageSource stretched/cover over button body  
   → most CTAs in-game use `backgrounds.bg026` (green texture) or `backgrounds.bg022` / `bg015`
2. `solidColor` — flat `backgroundColor`
3. Gradient via `appearance` / `gradientColors`

---

## Sizes (height in dp)

| `btnSize` | Height |
|-----------|--------|
| `xs`      | 56     |
| `sm`      | 64     |
| `md`      | 80     |
| `lg`      | 96     |

Override with `height` prop (exact px).

---

## Gloss Layer

Every button renders a semi-transparent white highlight strip at the top:

```ts
position: "absolute"
top: 4, left: 4, right: 4
height: "45%"
borderRadius: (same as button)
backgroundColor: "rgba(255,255,255,0.25)"
```

This creates the shiny top-half effect without any blur or filter.

---

## Shadow

**iOS:**
```ts
shadowColor: shadowColor  // default "#000"
shadowOffset: { width: 0, height: 5 }
shadowOpacity: 0.8
shadowRadius: 0.5
```

**Android:** `elevation: 10`

Override `shadowColor` for colored shadows (e.g., `"#005f07"` for green glow buttons, `"#410047"` for purple/store).

---

## Glow Effect

Optional. Two-layer approach:

1. **Background halo** — absolute `View` behind button, `backgroundColor: glowColor`, `opacity: 0.45`
2. **iOS shadow** — `shadowColor: glowColor`, `shadowRadius: glowIntensity` (default `8`), `shadowOpacity: 1`

Common glow configs:

| Context             | `glowColor`                   | `glowIntensity` |
|---------------------|-------------------------------|-----------------|
| Primary CTA / "play"| `rgba(41,255,25,0.8)`         | 8               |
| Avatar name button  | `rgba(255,204,0,1)`           | 8               |
| Default             | `rgba(253,193,194,0.8)` (pink)| 8               |

---

## Press Animation

On `onPressIn → onPressOut` with `Animated.timing`:

| Property    | At rest | Pressed | Duration     |
|-------------|---------|---------|--------------|
| `translateY`| 0       | +6      | in 80ms / out 120ms |
| `scale`     | 1       | 0.97    | in 80ms / out 120ms |
| Dark overlay| 0%      | 15%     | same timing  |

The button **sinks down by 6dp** and shrinks slightly — physical "push" feel.

---

## Icon Overlay Presets

When `iconPosition="leftAbsolute"` or `iconOverlayPreset` is set, the icon renders **outside** the clipped button body (no overflow clipping):

| Preset      | Offset                              | Rotation    |
|-------------|-------------------------------------|-------------|
| `play`      | `top: -8, left: -10`                | `-8deg`     |
| `party`     | `top: -8, left: -10`                | `-8deg`     |
| `store`     | `left: -16, bottom: -8`             | `+4deg`     |
| `rulebook`  | `right: -10, top: (height-ih)/2`    | `-11deg`    |

Custom offsets via `iconTop / iconBottom / iconLeft / iconRight` override presets per-key.

---

## Badge (Label Chip)

Small pill overlaid on the button corner:

```ts
backgroundColor: "#FFD966"
color: "#000"
fontSize: 10, fontWeight: "800", textTransform: "uppercase"
paddingHorizontal: 8, paddingVertical: 4
borderRadius: 999
position: "absolute", top: -10
```

Positioning: `right: -10` (default) or `left: -10` via `labelSide` prop.

---

## Accessibility

- `accessibilityRole: "button"`
- `accessibilityLabel` defaults to `title` text
- `disabled` → `opacity: 0.5`, `Pressable.disabled: true`
