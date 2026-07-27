# Spacing & Layout

## Horizontal Padding

Computed responsively via `getHorizontalPadding(windowWidth)`:

```ts
const soft = Math.max(12, windowWidth * 0.04);
return Math.max(48, Math.min(64, soft));
// → always 48–64dp regardless of screen width
```

Most screens: `paddingHorizontal: horizontalPadding` on content containers.  
Buttons get `horizontalPadding={Math.min(52, horizontalPadding + 8)}` (slightly tighter).

---

## Logo Block Margin Top

From top of scroll area to the logo block:

```ts
TOP_EDGE_ICON_OFFSET (48) + topIconSize + 16 + LOGO_EXTRA_BELOW_TOP_ROW (68)
```

`topIconSize = Math.min(56, Math.max(40, windowWidth * 0.13))` — 40–56dp.

Typical result: ~180–190dp from the top of the scrollable area.

---

## Screen Breakpoints

| Condition                       | Label              |
|---------------------------------|--------------------|
| `width >= 768 && width > height`| `isTablet`         |
| `height < 700`                  | `isCompactHeight`  |
| `height < 560`                  | `isShortScreen`    |
| `width < 420`                   | Stack store/rulebook buttons vertically |

---

## Safe Area Handling

Screens use `react-native-safe-area-context`:

```tsx
// Content only — background bleeds under notch/bar
<SafeAreaView edges={["right", "left"]}>

// Full inset — bottom padding included
<SafeAreaView edges={["bottom", "left", "right"]}>
```

Footer bars inside screens add `paddingBottom: insets.bottom + 16` manually.

---

## Card / Plate Padding

QuestionPlate / name-plate style containers:

```ts
borderRadius: 18
paddingHorizontal: 32
paddingVertical: 24
```

Dividers inside plates:
```ts
width: "88%"
height: 1
marginVertical: 8
backgroundColor: "rgba(89,36,16,0.5)"
```

---

## Pick Grid (QuestionScreen)

Player avatar pick layout uses a 2-column grid (3 on tablet):

```ts
// Cell
width: "50%"       // 33.33% on tablet
paddingHorizontal: 16  // = ~32dp gap between cells

// Row gap
marginBottom: 40
```

Avatar diameter and font size scale with `cellWidth`:
```ts
const target = Math.round(Math.min(164, Math.max(48, innerWidth * 0.88)));
// Font: Math.round(Math.min(18, Math.max(11, innerWidth / 8.2)))
```

---

## Footer Positioning

Primary CTAs at screen bottom use `position: "absolute"` in a `StyleSheet`:

```ts
footer: {
  position: "absolute",
  bottom: 0,
  left: pad,
  right: pad,
  paddingBottom: insets.bottom + 16,
}
```

---

## ScrollView Padding

Question screen scroll content container:

```ts
paddingTop: 96
paddingBottom: (isNumber || isInput || isRate ? 32 : 96) + iosKeyboardScrollPad
flexGrow: 1
justifyContent: "space-between"
```

---

## Top Bar Icons

Settings/profile icons in the top bar:

```ts
topIconSize = Math.min(56, Math.max(40, windowWidth * 0.13))
// Positioned at top: TOP_EDGE_ICON_OFFSET = 48 from screen top
```

---

## Logo Reference Dimensions

```ts
LOGO_REF = { w: 360, h: 280 }   // base logo size
HTP_OVERLAY_REF = { w: 350, h: 260, top: -88, left: 12 }
```

Logo scales to fit content width: `maxW = Math.min(360, windowWidth - pad*2)`.
