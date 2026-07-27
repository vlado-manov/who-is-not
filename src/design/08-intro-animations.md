# Intro Animations by Screen

This document maps each screen/component to its entrance animation pattern.

---

## Pattern A — Logo + Image Spin-Drop
> Used by: **WelcomeScreen**, **MenuPlayScreen**, **HeroPickerScreen** (via `AnimatedLogoHero`)

The logo and its overlay image enter together in one `Animated.View`:

```
Initial state:  translateY=-800, scale=25, rotate="-900deg"
Final state:    translateY=0,    scale=1,  rotate="0deg"

translateY → Animated.spring(0, { speed: 14, bounciness: 8 })
scale      → Animated.timing(1, 850ms, Easing.out(Easing.exp))
rotate     → Animated.timing(1, 850ms, Easing.out(Easing.cubic))
             → interpolated [0,1] to ["-900deg","0deg"]
All three run in parallel.
```

**Visual effect:** The logo and character art spin into view from far above, materializing out of a tiny rotating point, settling with a gentle spring bounce.

The overlay image (character/mascot) is positioned absolutely on top of the logo (e.g., `top: -88` to peek above the logo frame) and travels with it.

---

## Pattern B — Stamp Slam (VoteNowScreen)

**File:** `src/components/VoteNowScreen.tsx`

Same Phase 1 as Pattern A (spin-drop). After landing, adds:

```
Phase 2 — impact:
  Cross-fade: animated image → static image  (130ms)
  Screen shake: translateX oscillates ±8px over 4×60ms steps
```

**Visual effect:** The "VOTE NOW" stamp flies in spinning, slams down (crossfade to crisp static image), and shakes the screen on impact.

Character decoration image positioned `top: negative` above the stamp, travels with it in Phase 1.

---

## Pattern C — Plate Pop-In (QuestionScreen)

**File:** `src/screens/Game/QuestionScreen.tsx`

```
Initial state:  scale=40, opacity=0
Final state:    scale=1,  opacity=1

plateScale   → timing(1, 400ms, Easing.out(Easing.back(3)))
plateOpacity → timing(1, 200ms, linear)
Both in parallel, then screen shake.
```

**Visual effect:** The question plate slams in — it starts enormous (40×) and compresses to normal size with slight overshoot from `Easing.back(3)`. Fires simultaneously with the `playRevealTitleSplash()` sound. Screen shakes on impact.

---

## Pattern D — Input Reveal (QuestionScreen — number/input types)

```
Initial state:  scale=0.8, opacity=0
Final state:    scale=1,   opacity=1

numberInputScale   → timing(1, 420ms, Easing.out(Easing.back(2.5)))
numberInputOpacity → timing(1, 260ms, linear)
Both in parallel.
```

**Visual effect:** The number input card or hero image pops in from 80% scale with a gentle overshoot. Appears only after the question plate has already settled.

---

## Pattern E — VoteNowScreen CTA (no intro anim)

The "IT'S ME" button and player name below the stamp have no dedicated entrance animation — they are rendered immediately as part of the layout. The stamp animation dominates attention.

---

## Pattern F — WarmBubbles (ambient, not an intro)

WarmBubblesOverlay runs continuously behind all game screens. Not an intro animation, but layered on top of the background image. Each bubble fades in over ~12% of its duration, travels upward, fades out. Loops indefinitely.

---

## Pattern G — Screen Curtain (App Launch)

**File:** `src/components/CurtainOverlay.tsx`

On first launch (`WelcomeScreen` without `skipCurtain` param), a curtain overlays the screen and animates out. Gives a theatrical reveal of the welcome screen. Fires once per session.

---

## Summary Table

| Screen / Component    | Pattern            | Key values                              |
|-----------------------|--------------------|-----------------------------------------|
| WelcomeScreen logo    | A — spin-drop      | spring Y, 850ms scale/rotate, −900deg  |
| MenuPlayScreen logo   | A — spin-drop      | same as above                           |
| HeroPickerScreen      | A — spin-drop      | same as above                           |
| VoteNowScreen stamp   | B — stamp slam     | spin-drop + 130ms crossfade + shake    |
| QuestionScreen plate  | C — plate pop-in   | scale 40→1 back(3), 400ms + shake      |
| QuestionScreen input  | D — input reveal   | scale 0.8→1 back(2.5), 420ms          |
| App launch            | G — curtain        | overlay animate out                     |
| All game screens bg   | — WarmBubbles      | ambient, continuous                     |

---

## Screen Shake (reusable sub-pattern)

Used in both Pattern B and C:

```ts
const screenShake = useRef(new Animated.Value(0)).current;

// 4-step sequence, 60ms each = 240ms total
Animated.sequence([
  timing(screenShake, { toValue:  1, duration: 60 }),
  timing(screenShake, { toValue: -1, duration: 60 }),
  timing(screenShake, { toValue:  1, duration: 60 }),
  timing(screenShake, { toValue:  0, duration: 60 }),
]).start();

// Applied as:
transform: [{
  translateX: screenShake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  }),
}]
```

Wraps the entire content layer (not just the card) so the whole screen shakes.
