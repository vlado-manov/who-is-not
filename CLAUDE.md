# App (whoisnot) — CLAUDE.md

React Native Expo app — the game itself.

## Screen Structure

```
src/screens/
├── WelcomeScreen.tsx
├── MenuPlayScreen.tsx
├── PlayersNumberScreen.tsx
├── HeroPickerScreen.tsx        character selection
├── HeroPicker/                 HeroPicker sub-components
├── LobbyScreen.tsx
├── OnlineHostScreen.tsx
├── OnlineJoinScreen.tsx
├── RoomCodeScreen.tsx
├── CreateRoomScreen.tsx
├── Game/                       in-game screens (see GAME_CONTEXT.md)
│   ├── QuestionScreen.tsx
│   ├── VoteScreen.tsx
│   ├── VoteResultsScreen.tsx
│   ├── PreRevealScreen.tsx
│   ├── RevealScreen.tsx
│   ├── LivesRevealScreen.tsx
│   ├── PlayerDeathScreen.tsx
│   ├── DeathMatchScreen.tsx
│   ├── StandingsScreen.tsx
│   ├── ResultsScreen.tsx
│   └── WinnerScreen.tsx
├── ProfileScreen.tsx
├── StoreScreen.tsx
└── ... (support, legal screens)
```

For the full game phase flow see [../docs/GAME_CONTEXT.md](../docs/GAME_CONTEXT.md).

---

## Navigation

React Navigation stack. Screen params are typed — always define param types in the navigation types file before adding a new screen. Never pass untyped `any` params.

Pattern for navigating to a game screen:

```ts
navigation.navigate("QuestionScreen", { roomId, players, currentQuestion });
```

---

## Online vs Offline Branching

The single biggest architectural pattern in the app: **every game screen branches on `mode`**.

```ts
if (mode === "ONLINE") {
  // WebSocket-driven: wait for relay messages, host is authoritative
} else {
  // Local: pass & play on one device, app is fully authoritative
}
```

Never collapse these branches. The timing, state update triggers, and UI flow differ significantly between modes.

---

## Multiplayer Relay

For online play, all game events go through `sendMultiplayerRelay()`:

```ts
sendMultiplayerRelay(MESSAGE_TYPE, payload);
```

Message types are constants (e.g., `DEATHMATCH_SECRET_MESSAGE_TYPE`, `DEATHMATCH_GUESS_MESSAGE_TYPE`). Define new types as named constants, never inline strings.

The host client computes the result and broadcasts `*_DONE` messages. Non-host clients wait and react. Never let a non-host client decide game state.

---

## Hero / Character

Characters are selected in `HeroPickerScreen`. Each player claims one character for the session — claims are tracked server-side so two players cannot pick the same hero in an online room.

A character has rich media: `MAIN` pose, `SECONDARY` (picker animation), `WIN`, `LOSE`, `DEATH`, `DEATHMATCH`, `FINAL_WINNER`, `FINAL_LOSER` images. Use the correct media type for the screen context.

---

## Design System

See [../docs/DESIGN_CONTEXT.md](../docs/DESIGN_CONTEXT.md) for the full design reference.

Key rules:
- All text via `CustomText` with a typed `variant` prop — never raw `<Text>` with manual fontSize
- All buttons via `CustomButton` — never raw `<Pressable>` styled as a button
- Full-bleed screens use `FullBleedStack` with a `backdrop` prop
- Root background fallback: `backgroundColor: "#0a0a0a"`
- Safe area: `backgroundColor: "transparent"` on SafeAreaView so background bleeds under notch

---

## Responsive Scaling

Font sizes and layout dimensions scale linearly with screen width:

```ts
const scale = Math.min(1, width / 390);  // reference width 390px
```

Horizontal padding is always 48–64dp (`getHorizontalPadding(windowWidth)`). Screen breakpoints:

| Condition                       | Label            |
|---------------------------------|------------------|
| `width >= 768 && width > height`| tablet           |
| `height < 700`                  | compact height   |
| `height < 560`                  | short screen     |

---

## Multilingual

The app displays content in the device locale language if supported (`en`, `bg`, `fr`, `es`). When adding new user-facing strings, add them to all supported locale files — never English-only.

---

## Premium Gating

Characters and packs with `premium: true` require a valid unlock before use. The unlock check happens via the user inventory from the backend. Do not client-side-only gate premium content.
