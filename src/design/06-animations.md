# Animations

All animations use React Native's `Animated` API with `useNativeDriver: true` unless noted.

---

## 1. Logo + Image Hero Entrance (AnimatedLogoHero)

**File:** `src/components/AnimatedLogoHero.tsx`  
**Used in:** Welcome, HeroPicker, MenuPlay (and reused as pattern in VoteNowScreen)

Three values animate **in parallel**:

```ts
translateY: Animated.Value(-800) → spring(0, speed:14, bounciness:8)
scale:      Animated.Value(25)   → timing(1, 850ms, Easing.out(Easing.exp))
rotate:     Animated.Value(0)    → timing(1, 850ms, Easing.out(Easing.cubic))
              // interpolated: "−900deg" → "0deg"
```

Effect: the logo/image **drops from above**, **spins in** from −900°, and **scales from 25× down to normal**. The spring on Y gives a subtle bounce.

The overlay image (character art / decoration) moves with the logo inside the same `Animated.View`.

---

## 2. VoteNow Stamp Entrance

**File:** `src/components/VoteNowScreen.tsx`

Two-phase `Animated.sequence`:

### Phase 1 — Flying in (parallel)
```ts
translateY: Animated.Value(-800) → spring(0, speed:14, bounciness:8)
scale:      Animated.Value(25)   → timing(1, 850ms, Easing.out(Easing.exp))
rotate:     Animated.Value(0)    → timing(1, 850ms, Easing.out(Easing.cubic))
              // "−900deg" → "0deg"
```

Two `AppImage` instances overlap:
- **Animated version** (`opacity: animatedVoteMarkOpacity` starts at 1) — this one spins and falls.
- **Static version** (`opacity: staticVoteMarkOpacity` starts at 0) — snaps in when animation ends.

### Phase 2 — Swap to static + screen shake (sequence)
```ts
// Cross-fade: animated out, static in
animatedVoteMarkOpacity: 1 → 0, 130ms
staticVoteMarkOpacity:   0 → 1, 130ms

// Screen shake (4-step sequence)
screenShake: 0 → 1 → -1 → 1 → 0  (60ms each step)
// Applied as: translateX interpolated [-1,1] → [-8px, +8px]
```

The shake lands right as the stamp "hits" the screen — physical impact feel.

---

## 3. Question Plate Entrance (QuestionScreen)

**File:** `src/screens/Game/QuestionScreen.tsx`

Two-phase `Animated.sequence`:

### Phase 1 — Plate pops in (parallel)
```ts
plateScale:   Animated.Value(40) → timing(1, 400ms, Easing.out(Easing.back(3)))
plateOpacity: Animated.Value(0)  → timing(1, 200ms, linear)
```

`Easing.back(3)` overshoots slightly before settling — "stamp landing" feel.  
`plateScale` starting at `40` (not `0`) means it flies in large and shrinks to normal.

Fires simultaneously with `AudioManager.playRevealTitleSplash()`.

### Phase 2 — Screen shake (same 4-step pattern as VoteNow)
```ts
screenShake: 0 → 1 → -1 → 1 → 0  (60ms each)
// Applied as translateX: [-1,1] → [-8px, 8px]
```

---

## 4. Number Input Reveal (QuestionScreen)

When question type is `number` or `input`:

```ts
numberInputScale:   Animated.Value(0.8) → timing(1, 420ms, Easing.out(Easing.back(2.5)))
numberInputOpacity: Animated.Value(0)   → timing(1, 260ms, linear)
```

Both run in parallel. The input "pops in" from 80% scale with a gentle overshoot.

On each keystroke, a micro-bounce:
```ts
scale: 1 → 1.04 (80ms) → spring back to 1 (friction: 6)
```

---

## 5. Avatar Pick Button (QuestionScreen)

**Component:** `AvatarPickButton`

#### Scale (avatar circle + label together)
```ts
onPressIn:  spring(scaleAnim, toValue: 1.1, friction: 6)
onPressOut: spring(scaleAnim, toValue: 1,   friction: 6)
```

#### Slow rotation (long-press easter egg, fires after 1500ms hold)
```ts
// Starts looping on long-press:
Animated.loop(timing(rotateAnim, toValue: 1, 3000ms, Easing.linear))
// interpolated: "0deg" → "360deg"

// On release: spin out + settle
Animated.sequence([
  timing(rotateAnim, toValue: 4, 600ms, Easing.out(Easing.exp)),
  timing(rotateAnim, toValue: 0, 400ms, Easing.out(Easing.quad)),
])
```

---

## 6. Button Press Animation (CustomButton)

**File:** `src/components/common/CustomButton.tsx`

```ts
// onPressIn (80ms)
translateY: 0 → 6
scale:      1 → 0.97
overlayOpacity: 0 → 0.15  (dark wash)

// onPressOut (120ms)
translateY: 6 → 0
scale:      0.97 → 1
overlayOpacity: 0.15 → 0
```

All values on the same `pressAnim` interpolated simultaneously. Gives a tactile "button sinking into surface" effect.

---

## 7. WarmBubbles (Ambient Particles)

**File:** `src/components/WarmBubblesOverlay.tsx`

Each bubble:
```ts
// posY: bottom of screen → -(screenHeight + size*2)
timing(posY, toValue: -(height + size*2), dur, Easing.linear)

// alpha: fade in → hold → fade out
sequence([
  timing(alpha, toValue: opacity,       dur * 0.12),  // 12% fade in
  timing(alpha, toValue: opacity * 0.7, dur * 0.68),  // 68% hold at 70%
  timing(alpha, toValue: 0,             dur * 0.20),  // 20% fade out
])
```

On finish: loops via recursive `run()` callback. Each bubble starts with its own `delay` so they're staggered naturally.

Duration range: 2000ms (fastest urgent) → 13500ms (slowest normal).

---

## 8. Curtain Transition

**File:** `src/components/CurtainOverlay.tsx`

Opening curtain animation on app launch (WelcomeScreen). Overlays on initial mount, animates out.

---

## 9. Closing Curtain (Screen Exit)

**File:** `src/components/ClosingCurtainOverlay.tsx`

Used when navigating away from screens with a dramatic exit.

---

## Common Animation Patterns

### Screen shake (reused in Question + VoteNow)
```ts
const screenShake = useRef(new Animated.Value(0)).current;

Animated.sequence([
  timing(screenShake, { toValue:  1, duration: 60 }),
  timing(screenShake, { toValue: -1, duration: 60 }),
  timing(screenShake, { toValue:  1, duration: 60 }),
  timing(screenShake, { toValue:  0, duration: 60 }),
]).start();

// Applied in style:
transform: [{
  translateX: screenShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  }),
}]
```

Total shake duration: 240ms. Amplitude: ±8px.

### Spring drop from top
```ts
translateY: Animated.Value(-800) → spring(0, { speed: 14, bounciness: 8 })
```

`speed: 14` is moderately fast. `bounciness: 8` gives a subtle single bounce at the bottom.

### Scale + spin combo (logo/stamp entrance)
```ts
// Start: scale=25, rotate="-900deg"
// End:   scale=1,  rotate="0deg"
// Duration: 850ms
// Easing: Easing.out(Easing.exp) / Easing.out(Easing.cubic)
```

The −900deg = −2.5 full rotations. Combined with the 25× → 1 scale-down it looks like the element is spinning into existence from a tiny point far away.
