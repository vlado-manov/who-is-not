# UI Elements

---

## QuestionPlate

**File:** `src/components/game/QuestionPlate.tsx`

A parchment-style card that displays a question. Two modes: `light` (warm parchment, brown text) and `dark` (red-tinted, cream text).

```tsx
<QuestionPlate
  text="Who is most likely to…"
  title="Round 3"           // optional — adds a subtitle + divider above
  subtitle="(pick one)"     // optional — adds divider + subtext below
  background={backgrounds.bg005}
  mode="light"              // "light" | "dark"
  textVariant="h5"          // "h5" | "h5-headline" | "h6-headline"
/>
```

Structure:
```
┌─────────────────────────────┐
│  [title] (p-small)          │
│  ─────────────────────────  │ ← divider 88% width, 1px
│  [main text] (h5 by default)│
│  ─────────────────────────  │
│  [subtitle] (p-small)       │
└─────────────────────────────┘
```

Styling:
- `borderRadius: 18`, `paddingHorizontal: 32`, `paddingVertical: 24`
- Double shadow: outer `shadowColor: white/red` + inner `shadowColor: yellow/glow`
- `borderTopWidth: 1` + `borderBottomWidth: 1` with theme colors
- Background image stretched (`resizeMode: "stretch"`) with `imageStyle: { borderRadius: 18 }`

---

## NamePlate (QuestionScreen inline variant)

Same visual language as QuestionPlate but constructed inline in `QuestionScreen`:

```ts
// Entrance: plateScale 40→1 with Easing.out(Easing.back(3)) + screen shake
namePlateShadow: {
  shadowColor: "#fff",
  shadowOpacity: 1,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
  elevation: 14,
}
namePlate: {
  borderRadius: 18,
  paddingHorizontal: 32,
  paddingVertical: 24,
  shadowColor: "#ffd800",
  shadowOpacity: 0.8,
  shadowRadius: 4,
  borderTopColor: "rgba(251,192,32,1)",
  borderBottomColor: "rgba(160,110,60,0.7)",
}
```

Contains: round label (p), divider, question text (h5, allowWrap), divider, type hint (p-small).

---

## AvatarPickButton (Pick question type)

**File:** `src/screens/Game/QuestionScreen.tsx` — `AvatarPickButton`

Structure:
```
┌─────────────────────────────┐
│    ┌──────────────────┐     │
│    │  [avatar image]  │     │  ← circular crop with colored shadow
│    └──────────────────┘     │
│  [CustomButton — tertiary]  │  ← name label, bg: backgrounds.bg018
└─────────────────────────────┘
```

Avatar circle:
```ts
// No explicit borderRadius — shadow gives the halo effect
shadowColor: characterColor    // per-hero hex color
shadowOpacity: selected ? 0.9 : 0.4
shadowRadius: selected ? 14 : 6
shadowOffset: { width: 0, height: 6 }
```

Avatar image sticks up `marginBottom: -20` above the button so it overlaps.

On press: scale spring to 1.1 → back to 1. On 1500ms long-press: slow 360° rotation loop, snap-out on release.

---

## VoteNow Stamp

**File:** `src/components/VoteNowScreen.tsx`

The "VOTE NOW" image with character decoration above it. Two overlapping `AppImage` instances:

1. **Animated stamp** — spins and falls on entrance, fades out at end
2. **Static stamp** — fades in when animated stamp reaches final position

Above the stamp: random character image (`VOTE_NOW_IMAGE_URLS` pool of 5) positioned with negative top offset.

Sizing is responsive:
```ts
const maxH = Math.min(baseVoteMark.height, Math.max(96, windowHeight * 0.32));
const scale = maxH / baseVoteMark.height;
// voteMark: { width, height }
// deco: { width, height, top: negative (above stamp), left: centered }
```

Stamp is horizontally centered, vertically centered in the "stage" area above the footer.

---

## FullBleedStack

**File:** `src/components/FullBleedStack.tsx`

Layout wrapper that places `backdrop` absolutely behind children:

```tsx
<View style={[{ flex: 1 }, rootStyle]}>
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {backdrop}
  </View>
  {children}
</View>
```

Used on every game screen. The backdrop is never interactive (`pointerEvents="none"`).

---

## ScreenTopBar

**File:** `src/components/common/ScreenTopBar.tsx`

Top row with settings gear + profile icon (or back button). Always positioned at `top: TOP_EDGE_ICON_OFFSET (48)` from the screen edge, `position: "absolute"`.

---

## ScreenBackButton

**File:** `src/components/common/ScreenBackButton.tsx`

Simple back chevron, used on most non-game screens.

---

## DecoratedMenuButton

**File:** `src/components/common/DecoratedMenuButton.tsx`

Menu item style button with decorative border/frame treatment.

---

## PurpleConfirmModal

**File:** `src/components/common/PurpleConfirmModal.tsx`

Destructive-action confirmation dialog (purple/danger color scheme). Used for skip/exit confirmations.

---

## ImagePanel

**File:** `src/components/ImagePanel.tsx`

Full-bleed image container with optional content overlay. Used for hero images and illustration panels.

---

## RatingSlider

**File:** `src/components/RatingSlider.tsx`

Horizontal slider for "rate" type questions. Custom rail rendered with `railFrameImage` background. Value range 1–10.

---

## OnlineRoomBanner

**File:** `src/components/online/OnlineRoomBanner.tsx`

Top banner shown during online multiplayer sessions displaying the room code.

---

## FloatingChatDock

**File:** `src/components/discussion/FloatingChatDock.tsx`

Floating action button + slide-up chat sheet for discussion phase.

---

## CardAmbienceCanvas

**File:** `src/components/game/CardAmbienceCanvas.tsx`

Canvas-based particle/ambience effect layered over the card reveal screens.
