import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";

import CamHearts from "./CamHearts";
import {
  CAM_COMPACT_CELL_HEIGHT,
  CAM_FONT,
  CAM_LAYOUT,
  CAM_OUT_DIM,
  CAM_TIMING,
} from "../../screens/Cam/cam.constants";
import type { CamPlayer } from "../../screens/Cam/cam.types";
import type {
  CamGridCell,
  CamGridLayout,
} from "../../screens/Cam/camGridLayout";

type Props = {
  players: CamPlayer[];
  layout: CamGridLayout;
  /** When set, hearts are shown and players at 0 are dimmed as eliminated. */
  lives?: { current: Record<string, number>; max: number };
  /** Players whose photos shake once (their lives were just revealed). */
  shakeIds?: string[];
  /** Slot left empty because a photo is still flying into it. */
  hiddenIndex?: number;
  /** Safe-area top: ribbons of the first row clear the notch. */
  topInset: number;
  /** Tapping a photo (to enlarge it). */
  onPressCell?: (index: number) => void;
};

/** Grid of player selfies above the bottom bar, each framed in the player's colour. */
export default function CamRosterGrid({
  players,
  layout,
  lives,
  shakeIds = [],
  hiddenIndex,
  topInset,
  onPressCell,
}: Props) {
  const showVs = players.length >= 2;
  // Smaller badge once the cells get short, so it covers less of the faces.
  const vsSize =
    players.length >= 7 ? VS_SIZE_COMPACT : VS_SIZE;

  return (
    <View style={{ width: layout.width, height: layout.height }}>
      {players.map((player, index) => {
        const cell = layout.cells[index];
        if (!cell || !player.photoUri || index === hiddenIndex) return null;
        return (
          <RosterCell
            key={player.id}
            player={player}
            photoUri={player.photoUri}
            cell={cell}
            lives={lives?.current[player.id]}
            maxLives={lives?.max ?? 0}
            shake={shakeIds.includes(player.id)}
            topInset={cell.y === 0 ? topInset : 0}
            compact={cell.height < CAM_COMPACT_CELL_HEIGHT}
            onPress={onPressCell ? () => onPressCell(index) : undefined}
          />
        );
      })}

      {/* TikTok battle: "VS" in the middle, on the seam between the columns. */}
      {showVs ? (
        <View
          pointerEvents="none"
          style={[
            styles.vs,
            {
              width: vsSize,
              height: vsSize,
              borderRadius: vsSize / 2,
              left: layout.width / 2 - vsSize / 2,
              top: layout.height / 2 - vsSize / 2,
            },
          ]}
        >
          <LinearGradient
            colors={[TIKTOK_CYAN, TIKTOK_PINK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.vsFill}
          >
            <Text style={styles.vsText}>VS</Text>
          </LinearGradient>
        </View>
      ) : null}

      {/* The battle score bar: each player's share is their lives. */}
      {lives && players.length >= 2 ? (
        <View pointerEvents="none" style={styles.scoreBar}>
          {players.map((player) => {
            const left = Math.max(0, lives.current[player.id] ?? 0);
            return (
              <View
                key={player.id}
                style={[
                  styles.scoreSegment,
                  {
                    backgroundColor: player.color,
                    // Out of the game: a sliver, so the order stays readable.
                    flex: Math.max(left, SCORE_MIN_SHARE),
                  },
                ]}
              >
                <Text style={styles.scoreText} numberOfLines={1}>
                  {left}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type CellProps = {
  player: CamPlayer;
  photoUri: string;
  cell: CamGridCell;
  lives: number | undefined;
  maxLives: number;
  shake: boolean;
  topInset: number;
  /** Short cell (7+ players): smaller pill and hearts. */
  compact: boolean;
  onPress?: () => void;
};

function RosterCell({
  player,
  photoUri,
  cell,
  lives,
  maxLives,
  shake,
  topInset,
  compact,
  onPress,
}: CellProps) {
  const pillTop = compact ? PILL_TOP_COMPACT : PILL_TOP;
  const pillHeight = compact ? PILL_HEIGHT_COMPACT : PILL_HEIGHT;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shake) return;
    const step = (toValue: number) =>
      Animated.timing(shakeX, {
        toValue,
        duration: CAM_TIMING.cellShakeStepMs,
        useNativeDriver: true,
      });
    const anim = Animated.sequence([
      step(8),
      step(-8),
      step(6),
      step(-6),
      step(0),
    ]);
    anim.start();
    return () => anim.stop();
  }, [shake, shakeX]);

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          left: cell.x,
          top: cell.y,
          width: cell.width,
          height: cell.height,
          transform: [{ translateX: shakeX }],
        },
      ]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        disabled={!onPress}
        accessibilityRole="imagebutton"
        accessibilityLabel={player.name}
        onPress={onPress}
      >
        <Image
          source={{ uri: photoUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </Pressable>
      {lives !== undefined && lives <= 0 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.out]}
        />
      )}
      {/* Team colour along the bottom edge of the tile. */}
      <View
        pointerEvents="none"
        style={[styles.teamStripe, { backgroundColor: player.color }]}
      />
      <CamNameRibbon
        name={player.name}
        color={player.color}
        topInset={topInset}
        compact={compact}
      />
      {lives !== undefined && (
        <View
          pointerEvents="none"
          style={[
            styles.hearts,
            { top: topInset + pillTop + pillHeight + (compact ? 4 : 6) },
          ]}
        >
          <CamHearts
            count={lives}
            max={maxLives}
            size={
              compact || maxLives > 3
                ? CAM_LAYOUT.heartSizeSmall
                : CAM_LAYOUT.heartSize
            }
            losing={false}
          />
        </View>
      )}
    </Animated.View>
  );
}

type RibbonProps = {
  name: string;
  color: string;
  topInset?: number;
  /** Short cell: a smaller pill. */
  compact?: boolean;
};

/**
 * The player's name as a TikTok LIVE guest label: a dark translucent pill in
 * the top-left corner with a dot in the player's colour.
 */
export function CamNameRibbon({ name, color, topInset = 0, compact = false }: RibbonProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.pill,
        { top: topInset + (compact ? PILL_TOP_COMPACT : PILL_TOP) },
        compact && styles.pillCompact,
      ]}
    >
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, compact && styles.pillTextCompact]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const TIKTOK_PINK = "#FE2C55";
const TIKTOK_CYAN = "#25F4EE";
const VS_SIZE = 56;
const VS_SIZE_COMPACT = 44;
const PILL_TOP = 10;
const PILL_HEIGHT = 30;
const PILL_TOP_COMPACT = 6;
const PILL_HEIGHT_COMPACT = 24;
const SCORE_MIN_SHARE = 0.25;

const styles = StyleSheet.create({
  // Tiles meet edge to edge with a thin dark seam, as in a TikTok battle.
  cell: {
    position: "absolute",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#000000",
  },
  out: {
    backgroundColor: CAM_OUT_DIM,
  },
  teamStripe: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
  },
  pill: {
    position: "absolute",
    left: 8,
    maxWidth: "78%",
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    paddingLeft: 8,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  pillDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  pillText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontFamily: CAM_FONT.bold,
    fontSize: 15,
  },
  pillCompact: {
    height: PILL_HEIGHT_COMPACT,
    borderRadius: PILL_HEIGHT_COMPACT / 2,
    paddingLeft: 6,
    paddingRight: 10,
    gap: 5,
  },
  pillTextCompact: { fontSize: 13 },
  hearts: {
    position: "absolute",
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  vs: {
    position: "absolute",
    width: VS_SIZE,
    height: VS_SIZE,
    borderRadius: VS_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    boxShadow: "0px 0px 18px rgba(254,44,85,0.7)",
  },
  vsFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    color: "#FFFFFF",
    fontFamily: CAM_FONT.extraBold,
    fontSize: 20,
    fontStyle: "italic",
  },
  scoreBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
  },
  scoreSegment: {
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    color: "#FFFFFF",
    fontFamily: CAM_FONT.extraBold,
    fontSize: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 2,
  },
});
