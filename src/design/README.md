# Design System Documentation

> `whoisnot` — React Native (Expo) mobile app

## Files

| File | Contents |
|------|----------|
| [01-colors.md](./01-colors.md) | Brand palette, semantic color mapping, button gradients, QuestionPlate themes, glow colors |
| [02-typography.md](./02-typography.md) | Font families, CustomText variants + sizes, button typography, responsive scaling |
| [03-buttons.md](./03-buttons.md) | CustomButton API, variants, appearances, sizes, gloss, shadow, glow, press animation, icon overlays, badge |
| [04-backgrounds.md](./04-backgrounds.md) | Full-bleed layout pattern, background catalog, WarmBubblesOverlay, ImageBackgroundWithLoadGate |
| [05-spacing.md](./05-spacing.md) | Horizontal padding system, logo margins, breakpoints, safe area, card padding, pick grid, footer positioning |
| [06-animations.md](./06-animations.md) | All animation values and patterns: logo entrance, stamp slam, plate pop-in, input reveal, button press, bubbles |
| [07-ui-elements.md](./07-ui-elements.md) | QuestionPlate, NamePlate, AvatarPickButton, VoteNow stamp, FullBleedStack, ScreenTopBar, RatingSlider, modals |
| [08-intro-animations.md](./08-intro-animations.md) | Per-screen intro animation mapping, patterns A–G, screen shake sub-pattern |

## Quick Reference

### New screen checklist
1. Wrap in `FullBleedStack` with `backgroundColor: "#0a0a0a"` root
2. Use `ImageBackgroundWithLoadGate` + `WarmBubblesOverlay` for backdrop
3. `SafeAreaView` with `backgroundColor: "transparent"`, edges `["right","left"]`
4. Pick intro animation pattern from `08-intro-animations.md`
5. Primary CTA: `CustomButton` with `backgroundImage={backgrounds.bg026}`, `glow`, `glowColor="rgba(41,255,25,0.8)"`, `shadowColor="#005f07"`

### Adding new text
Use `CustomText` with a variant from `02-typography.md`. Never set `fontFamily` inline — use the component.

### Adding new buttons
Use `CustomButton`. For background: prefer `backgroundImage` over gradient for textured look. For green glow CTA pattern see `03-buttons.md` → Glow Effect section.
