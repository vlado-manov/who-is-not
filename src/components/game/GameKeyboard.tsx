// src/components/game/GameKeyboard.tsx
import React, {
  createContext,
  useContext,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import AudioManager from "../../utils/audioManager";

type Props = {
  value: string;
  onChangeText: (next: string) => void;
  maxLength?: number;
  /** `text` = letters in the app language, `number` = digits only. */
  layout?: "text" | "number";
  /**
   * How typed letters are cased (keys always show capitals):
   * `characters` = all capitals, `words` = capital at the start of each word.
   */
  capitalize?: "characters" | "words";
  /** Safe-area bottom, added under the keys. */
  bottomInset?: number;
  /** Shows a key that hides the keyboard; the screen brings it back when the field is tapped. */
  onClose?: () => void;
  /** `game` (default) or `tiktok` (Cam Mode). */
  theme?: GameKeyboardTheme;
};

type Script = "latin" | "cyrillic";

/** Letter rows per app language. Bulgarian uses the phonetic phone layout. */
const LETTER_ROWS: Record<string, string[][]> = {
  en: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ],
  es: [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ],
  fr: [
    ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
    ["W", "X", "C", "V", "B", "N"],
  ],
  bg: [
    ["Я", "В", "Е", "Р", "Т", "Ъ", "У", "И", "О", "П", "Ч"],
    ["А", "С", "Д", "Ф", "Г", "Х", "Й", "К", "Л", "Ш", "Щ"],
    ["З", "Ь", "Ц", "Ж", "Б", "Н", "М", "Ю"],
  ],
};

const NUMBER_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

/** Special key ids; everything else is typed as-is. */
const BACKSPACE = "⌫";
const SPACE = " ";
const SWITCH = "⇄";
const CLOSE = "⌄";

const KEY_HEIGHT = 52;
const ROW_GAP = 8;
const KEY_GAP = 6;
const PANEL_PADDING = 10;
const PANEL_RADIUS = 18;
/** Height of the dark edge under a key that makes it look raised. */
const KEY_DROP = 2;
/** Space left and right of a full row, an inset (shorter) row and the digit pad. */
const SIDE_FULL = 6;
const SIDE_INSET = 20;
const SIDE_NUMBER = 40;
const NUMBER_KEY_GAP = 8;
const ROWS = 4;
/** Hold backspace: wait, then delete repeatedly. */
const REPEAT_DELAY_MS = 350;
const REPEAT_EVERY_MS = 70;

/** Height of the keyboard without the safe-area bottom (for layouts that lift above it). */
export function getGameKeyboardHeight(
  _layout: "text" | "number" = "text",
): number {
  return PANEL_PADDING * 2 + ROWS * KEY_HEIGHT + (ROWS - 1) * ROW_GAP;
}

/** The first row's touch cells reach up to the top edge of the panel. */
const PANEL_TOP_REACH = PANEL_PADDING - ROW_GAP / 2;
/** What is left under the last row once its cells take half a row gap. */
const PANEL_BOTTOM = PANEL_PADDING - ROW_GAP / 2;

/** How far the first/last key of a row reaches out to the side of the panel. */
function sideReach(inset: boolean): number {
  return (inset ? SIDE_INSET : SIDE_FULL) - KEY_GAP / 2;
}

/**
 * Ink panel, graphite letter keys with a lit top edge and a hard drop edge
 * (the key looks raised), darker function keys, gold as the only accent.
 */
const COLORS = {
  panelTop: "#1D1C25",
  panelBottom: "#111016",
  panelEdge: "rgba(255,255,255,0.10)",
  key: "#32313C",
  keyAction: "#22212A",
  keyTopEdge: "rgba(255,255,255,0.16)",
  keyDrop: "0px 2px 0px #08080B",
  keyPressed: "#4A4857",
  keyPressedRing: "rgba(255,211,106,0.9)",
  keyPressedGlow: "0px 0px 12px rgba(255,197,61,0.45)",
  label: "#F5F3EE",
  labelMuted: "#A9A6B4",
  accent: "#FFD36A",
  accentPressed: "#E9B94A",
  accentTopEdge: "#FFE9A8",
  accentDrop: "0px 2px 0px #8A6A1F",
  onAccent: "#221A05",
  preview: "#44424F",
  previewShadow: "0px 6px 14px rgba(0,0,0,0.55)",
  previewLabel: "#FFD36A",
  font: "Onest-SemiBold",
  fontBold: "Onest-Bold",
};

type KeyboardColors = typeof COLORS;

/**
 * TikTok look (Cam Mode): flat grey keys on a near-black panel, no relief and
 * no gold, TikTok Sans, a white pop-up with dark letters, and the hide key in
 * TikTok pink.
 */
const TIKTOK_COLORS: KeyboardColors = {
  panelTop: "#1E1E20",
  panelBottom: "#141415",
  panelEdge: "rgba(255,255,255,0.08)",
  key: "#3A3A3D",
  keyAction: "#2A2A2D",
  keyTopEdge: "transparent",
  keyDrop: "0px 1px 0px rgba(0,0,0,0.55)",
  keyPressed: "#5B5B60",
  keyPressedRing: "transparent",
  keyPressedGlow: "0px 1px 0px rgba(0,0,0,0.55)",
  label: "#FFFFFF",
  labelMuted: "rgba(255,255,255,0.72)",
  accent: "#FE2C55",
  accentPressed: "#D9244A",
  accentTopEdge: "transparent",
  accentDrop: "0px 1px 0px rgba(0,0,0,0.55)",
  onAccent: "#FFFFFF",
  preview: "#FFFFFF",
  previewShadow: "0px 6px 14px rgba(0,0,0,0.45)",
  previewLabel: "#161823",
  font: "TikTokSans-SemiBold",
  fontBold: "TikTokSans-Bold",
};

export type GameKeyboardTheme = "game" | "tiktok";

type KeyProps = {
  /** What the key sends to `onKey`. */
  id: string;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  flex?: number;
  /** Half of the gap to the next key; the touch area reaches that far. */
  gap?: number;
  /** Extra touch area for keys on the edge of the keyboard. */
  left?: number;
  right?: number;
  top?: number;
  accessibilityLabel: string;
  onKey: (id: string) => void;
  /** Keep firing while held (backspace). */
  repeat?: boolean;
  /** An empty cell that only keeps the row's spacing. */
  blank?: boolean;
};

/**
 * One key. Memoised with a stable `onKey`, so typing re-renders only the key
 * being pressed — not the whole keyboard on every letter.
 *
 * The touch area is the whole cell: it reaches halfway to each neighbour (and
 * out to the keyboard edge), so a tap between two keys goes to the nearer one.
 */
const Key = memo(function Key({
  id,
  label,
  icon,
  flex = 1,
  gap = KEY_GAP / 2,
  left = 0,
  right = 0,
  top = 0,
  accessibilityLabel,
  onKey,
  repeat = false,
  blank = false,
}: KeyProps) {
  const { styles, colors: COLORS } = useContext(KeyboardTheme);
  const [pressed, setPressed] = useState(false);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = () => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (repeatRef.current) clearInterval(repeatRef.current);
    delayRef.current = null;
    repeatRef.current = null;
  };
  useEffect(() => stopRepeat, []);

  const cell = {
    flex,
    paddingLeft: gap + left,
    paddingRight: gap + right,
    paddingTop: ROW_GAP / 2 + top,
    paddingBottom: ROW_GAP / 2,
  };
  if (blank) {
    return (
      <View style={cell}>
        <View style={styles.blankKey} />
      </View>
    );
  }

  const isSpace = id === SPACE;
  const isAction = icon !== undefined || id === SWITCH;
  const isCharacter = !isSpace && !isAction;
  // The key that hides the keyboard is the one gold key, so it is easy to find.
  const isClose = id === CLOSE;

  const press = () => {
    setPressed(true);
    onKey(id);
    if (repeat) {
      stopRepeat();
      delayRef.current = setTimeout(() => {
        repeatRef.current = setInterval(() => onKey(id), REPEAT_EVERY_MS);
      }, REPEAT_DELAY_MS);
    }
  };
  const release = () => {
    setPressed(false);
    stopRepeat();
  };

  return (
    // Raw touch events instead of Pressable: a Pressable takes one finger at a
    // time, so when typing with two thumbs the second key was dropped whenever
    // it went down before the first finger lifted. Acts on touch-down.
    <View
      accessible
      accessibilityRole="keyboardkey"
      accessibilityLabel={accessibilityLabel}
      onAccessibilityTap={() => onKey(id)}
      // A pressed key is drawn above its neighbours so the pop-up is not covered.
      style={pressed ? [cell, styles.cellRaised] : cell}
      onTouchStart={press}
      onTouchEnd={release}
      onTouchCancel={release}
    >
      <View
        style={[
          styles.key,
          isAction && styles.keyAction,
          isClose && styles.keyClose,
          pressed && (isClose ? styles.keyClosePressed : styles.keyPressed),
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={isClose ? 28 : 24}
            color={
              isClose
                ? COLORS.onAccent
                : pressed
                  ? COLORS.accent
                  : COLORS.labelMuted
            }
          />
        ) : (
          <Text
            style={[
              styles.keyLabel,
              isAction && styles.keyLabelAction,
              isSpace && styles.keyLabelSpace,
            ]}
            numberOfLines={1}
            maxFontSizeMultiplier={1}
          >
            {isSpace ? label?.toLocaleLowerCase() : label}
          </Text>
        )}
        {/* The letter pops up above the finger, as on a phone keyboard. */}
        {pressed && isCharacter && (
          <View pointerEvents="none" style={styles.preview}>
            <Text style={styles.previewLabel} maxFontSizeMultiplier={1}>
              {label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * The game's own on-screen keyboard, used instead of the device keyboard for
 * names and answers. Letters follow the app language (with a switch to Latin
 * when that is Bulgarian); `number` shows a digit pad.
 */
export default function GameKeyboard({
  value,
  onChangeText,
  maxLength,
  layout = "text",
  capitalize = "characters",
  bottomInset = 0,
  onClose,
  theme = "game",
}: Props) {
  const { t, i18n } = useTranslation();
  const look = THEMES[theme];
  const { styles, colors: COLORS } = look;
  const language = i18n.language.slice(0, 2);
  const hasCyrillic = language === "bg";
  const [script, setScript] = useState<Script>(
    hasCyrillic ? "cyrillic" : "latin",
  );

  // Everything the key handler needs is read through a ref, which keeps the
  // handler itself stable (see `Key`) and lets a held backspace keep deleting.
  const latest = useRef({
    value,
    onChangeText,
    maxLength,
    layout,
    capitalize,
    language,
    onClose,
  });
  latest.current = {
    value,
    onChangeText,
    maxLength,
    layout,
    capitalize,
    language,
    onClose,
  };

  // The text as typed so far. The `value` prop only catches up after the
  // screen re-renders, so a second key pressed before that would build on the
  // old text and the first letter would be lost.
  const typed = useRef(value);
  const pending = useRef<string[]>([]);
  if (value === typed.current) {
    pending.current = [];
  } else if (!pending.current.includes(value)) {
    // Changed from outside (cleared, replaced): follow it.
    typed.current = value;
    pending.current = [];
  }

  const onKey = useCallback((id: string) => {
    const now = latest.current;
    const current = typed.current;
    const commit = (next: string) => {
      typed.current = next;
      pending.current.push(next);
      now.onChangeText(next);
    };
    AudioManager.playKeyTap();

    if (id === CLOSE) {
      now.onClose?.();
      return;
    }
    if (id === SWITCH) {
      setScript((s) => (s === "cyrillic" ? "latin" : "cyrillic"));
      return;
    }
    if (id === BACKSPACE) {
      if (current.length > 0) commit(current.slice(0, -1));
      return;
    }
    if (now.maxLength !== undefined && current.length >= now.maxLength) return;

    const startsWord = current.length === 0 || current.endsWith(" ");
    // No leading or doubled spaces.
    if (id === SPACE && startsWord) return;
    const cased =
      now.layout === "number" || now.capitalize === "characters" || startsWord
        ? id
        : id.toLocaleLowerCase(now.language);
    commit(current + cased);
  }, []);

  const closeKey = (edges?: Partial<KeyProps>) => (
    <Key
      key={CLOSE}
      id={CLOSE}
      icon="chevron-down"
      {...edges}
      accessibilityLabel={t("keyboard_close")}
      onKey={onKey}
    />
  );
  const backspaceKey = (edges?: Partial<KeyProps>) => (
    <Key
      key={BACKSPACE}
      id={BACKSPACE}
      icon="backspace-outline"
      repeat
      {...edges}
      accessibilityLabel={t("keyboard_backspace")}
      onKey={onKey}
    />
  );

  if (layout === "number") {
    return (
      <KeyboardTheme.Provider value={look}>
        <View
          style={[styles.panel, { paddingBottom: PANEL_BOTTOM + bottomInset }]}
        >
          <LinearGradient
            colors={[COLORS.panelTop, COLORS.panelBottom]}
            style={styles.panelFill}
            pointerEvents="none"
          />
          {NUMBER_ROWS.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((key, k) => {
                const edges = {
                  gap: NUMBER_KEY_GAP / 2,
                  left: k === 0 ? SIDE_NUMBER - NUMBER_KEY_GAP / 2 : 0,
                  right:
                    k === row.length - 1 ? SIDE_NUMBER - NUMBER_KEY_GAP / 2 : 0,
                  top: r === 0 ? PANEL_TOP_REACH : 0,
                };
                if (key === BACKSPACE) return backspaceKey(edges);
                if (key === "") {
                  // The free corner holds the key that hides the pad.
                  return onClose ? (
                    closeKey(edges)
                  ) : (
                    <Key
                      key={k}
                      id=""
                      {...edges}
                      blank
                      accessibilityLabel=""
                      onKey={onKey}
                    />
                  );
                }
                return (
                  <Key
                    key={key}
                    id={key}
                    label={key}
                    {...edges}
                    accessibilityLabel={key}
                    onKey={onKey}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </KeyboardTheme.Provider>
    );
  }

  const rows =
    script === "cyrillic"
      ? LETTER_ROWS.bg
      : (LETTER_ROWS[hasCyrillic ? "en" : language] ?? LETTER_ROWS.en);

  return (
    <KeyboardTheme.Provider value={look}>
      <View
        style={[styles.panel, { paddingBottom: PANEL_BOTTOM + bottomInset }]}
      >
        <LinearGradient
          colors={[COLORS.panelTop, COLORS.panelBottom]}
          style={styles.panelFill}
          pointerEvents="none"
        />
        {rows.map((row, r) => {
          // Shorter rows are inset, as on a phone keyboard.
          const side = sideReach(r > 0 && row.length < rows[0].length);
          const hasBackspace = r === rows.length - 1;
          const top = r === 0 ? PANEL_TOP_REACH : 0;
          return (
            <View key={`${script}-${r}`} style={styles.row}>
              {row.map((key, k) => (
                <Key
                  key={key}
                  id={key}
                  label={key}
                  left={k === 0 ? side : 0}
                  right={!hasBackspace && k === row.length - 1 ? side : 0}
                  top={top}
                  accessibilityLabel={key}
                  onKey={onKey}
                />
              ))}
              {hasBackspace && backspaceKey({ flex: 1.3, right: side })}
            </View>
          );
        })}
        <View style={styles.row}>
          {hasCyrillic && (
            <Key
              id={SWITCH}
              label={script === "cyrillic" ? "ABC" : "АБВ"}
              flex={1.6}
              left={sideReach(true)}
              accessibilityLabel={t("keyboard_switch")}
              onKey={onKey}
            />
          )}
          <Key
            id={SPACE}
            label={t("keyboard_space")}
            flex={6}
            left={hasCyrillic ? 0 : sideReach(true)}
            right={onClose ? 0 : sideReach(true)}
            accessibilityLabel={t("keyboard_space")}
            onKey={onKey}
          />
          {onClose && closeKey({ flex: 1.6, right: sideReach(true) })}
        </View>
      </View>
    </KeyboardTheme.Provider>
  );
}

function makeStyles(COLORS: KeyboardColors) {
  return StyleSheet.create({
    // No padding or gaps here: the keys' touch cells cover the whole panel.
    // Nothing is clipped either, so the top row's pop-ups can rise above it.
    panel: {},
    panelFill: {
      ...StyleSheet.absoluteFill,
      borderTopLeftRadius: PANEL_RADIUS,
      borderTopRightRadius: PANEL_RADIUS,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: COLORS.panelEdge,
    },
    row: {
      flexDirection: "row",
    },
    cellRaised: {
      zIndex: 2,
    },
    key: {
      height: KEY_HEIGHT - KEY_DROP,
      marginBottom: KEY_DROP,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.key,
      borderTopWidth: 1,
      borderTopColor: COLORS.keyTopEdge,
      boxShadow: COLORS.keyDrop,
    },
    keyAction: {
      backgroundColor: COLORS.keyAction,
    },
    keyClose: {
      backgroundColor: COLORS.accent,
      borderTopColor: COLORS.accentTopEdge,
      boxShadow: COLORS.accentDrop,
    },
    keyClosePressed: {
      backgroundColor: COLORS.accentPressed,
    },
    keyPressed: {
      backgroundColor: COLORS.keyPressed,
      borderTopColor: COLORS.keyPressedRing,
      boxShadow: COLORS.keyPressedGlow,
    },
    blankKey: {
      height: KEY_HEIGHT,
    },
    keyLabel: {
      color: COLORS.label,
      fontFamily: COLORS.font,
      fontSize: 22,
    },
    keyLabelAction: {
      color: COLORS.labelMuted,
      fontSize: 15,
      letterSpacing: 0.5,
    },
    keyLabelSpace: {
      color: COLORS.labelMuted,
      fontSize: 15,
      letterSpacing: 0.4,
    },
    preview: {
      position: "absolute",
      left: -7,
      right: -7,
      bottom: KEY_HEIGHT + 4,
      height: 58,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.preview,
      borderTopWidth: 1,
      borderTopColor: COLORS.keyTopEdge,
      boxShadow: COLORS.previewShadow,
    },
    previewLabel: {
      color: COLORS.previewLabel,
      fontFamily: COLORS.fontBold,
      fontSize: 32,
    },
  });
}

const THEMES = {
  game: { colors: COLORS, styles: makeStyles(COLORS) },
  tiktok: { colors: TIKTOK_COLORS, styles: makeStyles(TIKTOK_COLORS) },
};

/** The look the keys are drawn in; set by `GameKeyboard` from its `theme`. */
const KeyboardTheme = createContext(THEMES.game);
