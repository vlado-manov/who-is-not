# Backgrounds

## Full-Bleed Layout Pattern

All game screens use `FullBleedStack` (`src/components/FullBleedStack.tsx`) which renders a `backdrop` layer at `StyleSheet.absoluteFill` behind a foreground `SafeAreaView`.

```tsx
<FullBleedStack
  rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}
  backdrop={
    <ImageBackgroundWithLoadGate
      source={backgrounds.bg023}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <WarmBubblesOverlay variant="normal" />
    </ImageBackgroundWithLoadGate>
  }
>
  <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
    {/* screen content */}
  </SafeAreaView>
</FullBleedStack>
```

The `backgroundColor: "#0a0a0a"` on the root catches the frame before the image loads.

---

## Background Image Catalog

Backgrounds live in `assets/backgrounds.ts`. Key ones referenced in-app:

| Key       | Used in                                      |
|-----------|----------------------------------------------|
| `bg005`   | Question plate (warm parchment texture)      |
| `bg015`   | Rulebook button                              |
| `bg018`   | Avatar name button (pick screen)             |
| `bg022`   | Store button                                 |
| `bg023`   | Main game background (portrait)              |
| `bg023t`  | Main game background (tablet/landscape)      |
| `bg026`   | Green texture — primary CTA, "PLAY" buttons  |

`bg026` is the most-used CTA background — it's a fabric/noise green texture that pairs with the green glow (`rgba(41,255,25,0.8)`).

---

## ImageBackgroundWithLoadGate

Wraps RN `ImageBackground` with a gate that prevents child render until the image is loaded. Used to avoid content flickering over a black screen.

`resizeMode="cover"` fills the screen; `resizeMode="stretch"` is used for plates/panels that need edge-to-edge texture fill.

---

## WarmBubblesOverlay

Animated particle overlay layered on top of the background image. See `src/components/WarmBubblesOverlay.tsx`.

Four intensity variants:

| Variant        | Bubble count | Duration range | Use case                               |
|----------------|-------------|----------------|----------------------------------------|
| `normal`       | 31          | 3.0–13.5s      | Welcome, menu screens                  |
| `intense`      | 20 (of 49)  | 2.1–4.2s       | VoteNow, game tension                  |
| `urgent`       | 30 (20+10)  | 1.7–4.2s       | Countdown, last-minute screens         |
| `resultsUrgent`| 38 (20+10+8)| 1.1–4.2s       | Results discussion finale              |

Bubbles start from `bottom: -size`, float up by `-(screenHeight + size*2)`, fade in over 12% of duration, hold at 70% opacity for 68%, then fade out over the last 20%.

---

## Question Plate Backgrounds

`QuestionPlate` uses `backgrounds.bg005` stretched as `ImageBackground` with `imageStyle={{ borderRadius: 18 }}`. The image provides the parchment texture; the component adds a colored glow shadow on top.

---

## Linear Gradients

Used sparingly (not as primary backgrounds):
- Inside `CustomButton` when no `backgroundImage` — diagonal gradient
- `expo-linear-gradient` imported for button bodies

---

## Screen Root Colors

```ts
// Game / Vote / Question screens
rootStyle={{ flex: 1, backgroundColor: "#0a0a0a" }}

// Safe area over background
style={{ flex: 1, backgroundColor: "transparent" }}

// Waiting / loading fallback
className="flex-1 bg-primary-700"  // #FA8900 amber
```
