import React, { useMemo } from "react";
import {
  Dimensions,
  ImageSourcePropType,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { usePreventBack } from "../../hooks/usePreventBack";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import AppImage from "../AppImage";
import FullBleedStack from "../FullBleedStack";
import ImageBackgroundWithLoadGate from "../ImageBackgroundWithLoadGate";
import DeathAmbienceOverlay from "./DeathAmbienceOverlay";
import PlayerDeathGrayscaleImage from "./PlayerDeathGrayscaleImage";
import CustomText from "../common/CustomText";
import {
  DEATH_BG_URI,
  DEATH_X_PART_1_URI,
  DEATH_X_PART_2_URI,
  YOU_GOT_COOKED_TITLE_URI,
} from "../../constants/deathScreen";

const { width: SCREEN_W } = Dimensions.get("window");

type Props = { playerId: string };

/**
 * End-of-game for eliminated players (online): same visual language as PlayerDeath finale —
 * no actions, only the defeat screen.
 */
export default function EliminatedGameEndView({ playerId }: Props) {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  usePreventBack();
  const players = useGameStore((s) => s.players);
  const heroes = useHeroesStore((s) => s.heroes);

  const deadPlayer = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId],
  );

  const hero = useMemo(
    () =>
      deadPlayer?.characterId
        ? heroes.find((h) => h.id === deadPlayer.characterId)
        : undefined,
    [deadPlayer?.characterId, heroes],
  );

  const loseImage: ImageSourcePropType | null = useMemo(() => {
    if (!hero) return null;
    const byVar = hero.loseImagesByVariant?.NORMAL;
    const pool = byVar && byVar.length > 0 ? byVar : (hero.loseImages ?? []);
    if (pool.length > 0) return pool[0] as ImageSourcePropType;
    return (hero.main_image ?? hero.profileImage) as ImageSourcePropType;
  }, [hero]);

  const heroStageHeight = Math.max(280, Math.round(windowHeight * 0.5));
  const heroImgSize = Math.min(SCREEN_W * 0.92, heroStageHeight * 0.88);
  const crossSize = Math.min(SCREEN_W * 1.05, heroStageHeight * 0.95);
  const titleHeight = Math.min(200, Math.round(SCREEN_W * 0.42));

  return (
    <SafeAreaView style={styles.safe} edges={["right", "left"]}>
      <FullBleedStack
        rootStyle={styles.root}
        backdrop={
          <ImageBackgroundWithLoadGate
            source={{ uri: DEATH_BG_URI }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            showChildrenWhileLoading
            underlayColor="#120818"
          >
            <LinearGradient
              colors={["rgba(8,2,16,0.15)", "rgba(8,2,16,0.55)", "rgba(4,0,10,0.82)"]}
              style={StyleSheet.absoluteFill}
            />
            <DeathAmbienceOverlay />
          </ImageBackgroundWithLoadGate>
        }
      >
        <View style={styles.content}>
          <AppImage
            source={{ uri: YOU_GOT_COOKED_TITLE_URI }}
            style={[styles.titleImg, { height: titleHeight }]}
            contentFit="contain"
            accessibilityLabel={t("player_death_title")}
          />
          <CustomText
            variant="h6-headline"
            className="text-center mt-2"
            textColor="#e9d5ff"
          >
            {deadPlayer?.name ?? "—"}
          </CustomText>

          {loseImage && (
            <View style={[styles.heroWrap, { minHeight: heroStageHeight }]}>
              <View style={{ width: heroImgSize, height: heroImgSize }}>
                <AppImage
                  source={loseImage}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="contain"
                />
                <View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFillObject, { opacity: 1 }]}
                >
                  <PlayerDeathGrayscaleImage
                    source={loseImage}
                    width={heroImgSize}
                    height={heroImgSize}
                  />
                </View>
              </View>
              <View pointerEvents="none" style={styles.crossAbs}>
                <AppImage
                  source={{ uri: DEATH_X_PART_1_URI }}
                  style={{ width: crossSize, height: crossSize }}
                  contentFit="contain"
                />
              </View>
              <View pointerEvents="none" style={styles.crossAbs}>
                <AppImage
                  source={{ uri: DEATH_X_PART_2_URI }}
                  style={{ width: crossSize, height: crossSize }}
                  contentFit="contain"
                />
              </View>
            </View>
          )}
        </View>
      </FullBleedStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0a0610" },
  root: { flex: 1, backgroundColor: "#0a0610" },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleImg: {
    width: SCREEN_W - 32,
    alignSelf: "center",
  },
  heroWrap: {
    flex: 1,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  purpleTint: {
    backgroundColor: "rgba(110, 20, 90, 0.48)",
  },
  crossAbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
