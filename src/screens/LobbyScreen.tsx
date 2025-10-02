// src/screens/LobbyScreen.tsx
import React, { useMemo } from "react";
import { View, ImageBackground, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import { useGameStore } from "../store/useGameStore";
import { HEROES } from "../data/heroes";
import CustomButton from "../components/common/CustomButton";

export default function LobbyScreen() {
  const { t } = useTranslation();

  const players = useGameStore((s) => s.players);

  const rows = useMemo(
    () =>
      players.map((p, idx) => {
        const hero = HEROES.find((h) => h.id === p.characterId);
        return {
          order: idx + 1,
          name: p.name || t("unnamed_player", { defaultValue: "Unnamed" }),
          heroName: hero?.name || t("no_hero", { defaultValue: "No hero" }),
          heroImage: hero?.main_image,
        };
      }),
    [players, t]
  );

  return (
    <SafeAreaView className="flex-1" edges={["right", "left"]}>
      <ImageBackground
        source={backgrounds.bg001}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View className="flex-1 w-full items-center px-6 pt-16 justify-between py-[80px] gap-8">
          <View className="mt-[24px] justify-center items-center max-w-[80%]">
            <CustomText variant="h3-headline" className="text-center">
              Are you
            </CustomText>
            <CustomText variant="h3" className="text-center" shadow>
              READY
            </CustomText>
          </View>

          <ScrollView
            style={{ alignSelf: "stretch" }}
            contentContainerStyle={{
              alignItems: "center",
            }}
            showsVerticalScrollIndicator
            showsHorizontalScrollIndicator={false}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 720,
                gap: 12,
                paddingHorizontal: 0,
              }}
            >
              {rows.length === 0 ? (
                <CustomText variant="label" className="opacity-70">
                  {t("no_players_yet", { defaultValue: "No players yet…" })}
                </CustomText>
              ) : (
                rows.map((r) => (
                  <View
                    key={`${r.order}-${r.name}`}
                    className="w-full flex-row items-center justify-between bg-[#ffffff95] rounded-2xl px-4 py-4"
                    style={{
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          overflow: "visible",
                          marginRight: 12,
                        }}
                      >
                        {r.heroImage ? (
                          <Image
                            source={r.heroImage}
                            resizeMode="contain"
                            style={{
                              width: "250%",
                              height: "250%",
                              position: "absolute",
                              left: "-80%",
                              top: "-30%",
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CustomText
                              variant="footnote"
                              textColor="text-customBlack-500"
                            >
                              ?
                            </CustomText>
                          </View>
                        )}
                      </View>

                      <CustomText
                        variant="quote"
                        className="capitalize"
                        shadow
                        textColor="text-customBlack-500"
                      >
                        {r.name}
                      </CustomText>
                    </View>

                    <CustomText
                      variant="p"
                      className="ml-3"
                      textColor="text-customBlack-500"
                    >
                      {r.heroName}
                    </CustomText>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <View className="w-full px-6 mt-4">
            <CustomButton
              title="Start game"
              color="bg-primary-500"
              fullWidth
              btnSize="sm"
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
