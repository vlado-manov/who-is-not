import React, { useMemo, useState } from "react";
import {
  Dimensions,
  ImageSourcePropType,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { usePreventBack } from "../../hooks/usePreventBack";
import { useGameStore } from "../../store/useGameStore";
import { useHeroesStore } from "../../store/useHeroesStore";
import AppImage from "../AppImage";
import CustomText from "../common/CustomText";
import {
  DEATH_X_PART_1_URI,
  DEATH_X_PART_2_URI,
  YOU_DIED_TITLE_URI,
  YOU_DIED_TITLE_URI_ALT,
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
  const [titleUri, setTitleUri] = useState(YOU_DIED_TITLE_URI);

  const deadPlayer = useMemo(
    () => players.find((p) => p.id === playerId),
    [players, playerId]
  );

  const hero = useMemo(
    () =>
      deadPlayer?.characterId
        ? heroes.find((h) => h.id === deadPlayer.characterId)
        : undefined,
    [deadPlayer?.characterId, heroes]
  );

  const loseImage: ImageSourcePropType | null = useMemo(() => {
    if (!hero) return null;
    const byVar = hero.loseImagesByVariant?.NORMAL;
    const pool = byVar && byVar.length > 0 ? byVar : hero.loseImages ?? [];
    if (pool.length > 0) return pool[0] as ImageSourcePropType;
    return (hero.main_image ?? hero.profileImage) as ImageSourcePropType;
  }, [hero]);

  const heroStageHeight = Math.max(280, Math.round(windowHeight * 0.5));
  const heroImgSize = Math.min(SCREEN_W * 0.92, heroStageHeight * 0.88);
  const crossSize = Math.min(SCREEN_W * 1.05, heroStageHeight * 0.95);

  return (
    <SafeAreaView style={styles.safe} edges={["right", "left"]}>
      <View style={styles.root}>
        <AppImage
          source={{ uri: titleUri }}
          style={styles.titleImg}
          contentFit="contain"
          accessibilityLabel={t("player_death_title")}
          onError={() => setTitleUri(YOU_DIED_TITLE_URI_ALT)}
        />
        <CustomText
          variant="h6-headline"
          className="text-center mt-2"
          textColor="#c9b8a8"
        >
          {deadPlayer?.name ?? "—"}
        </CustomText>

        {loseImage && (
          <View style={[styles.heroWrap, { minHeight: heroStageHeight }]}>
            <AppImage
              source={loseImage}
              style={{ width: heroImgSize, height: heroImgSize }}
              contentFit="contain"
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.grayOverlay]}
            />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  root: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  titleImg: {
    width: SCREEN_W - 32,
    height: Math.min(200, Math.round(SCREEN_W * 0.42)),
    alignSelf: "center",
  },
  heroWrap: {
    flex: 1,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  grayOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  crossAbs: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
