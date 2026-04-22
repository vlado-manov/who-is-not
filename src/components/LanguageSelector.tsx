import React from "react";
import { Pressable, View, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import {
  saveLanguagePreference,
  type SupportedLanguage,
} from "../i18n";
import { trackPlayerSessionStarted } from "../api/analytics";
import { useAuthStore } from "../store/useUserStore";
import AppImage from "./AppImage";

type Lang = SupportedLanguage;

/** Flags kept local - add to CDN and use cdn("images/flags/en") when ready */
const FLAGS: Record<Lang, any> = {
  en: require("../../assets/images/flags/en.png"),
  fr: require("../../assets/images/flags/fr.png"),
  es: require("../../assets/images/flags/es.png"),
  bg: require("../../assets/images/flags/bg.png"),
};

/** Android often renders bitmaps slightly larger; keep flags visually aligned with iOS. */
const FLAG_SIZE =
  Platform.OS === "android"
    ? { w: 28, h: 18 }
    : { w: 32, h: 20 };

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const userId = useAuthStore((s) => s.user.id);
  const current = (i18n.language as Lang) ?? "en";

  const setLang = async (lng: Lang) => {
    if (lng === current) return;
    await saveLanguagePreference(lng);
    await i18n.changeLanguage(lng);
    void trackPlayerSessionStarted({
      userId,
      source: "WELCOME",
      step: "language_selected",
      language: lng,
    }).catch((e) => {
      console.warn("track PLAYER_SESSION_STARTED(language_selected) failed", e);
    });
  };

  return (
    <View className="flex-row">
      {Object.entries(FLAGS).map(([code, img]) => {
        const active = current.startsWith(code);

        return (
          <View key={code} style={{ marginHorizontal: 4 }}>
            {active && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: 12,
                  backgroundColor: "rgba(255, 236, 33, 0.35)",
                }}
              />
            )}

            <Pressable
              onPress={() => setLang(code as Lang)}
              style={[
                {
                  paddingHorizontal: Platform.OS === "android" ? 8 : 10,
                  paddingVertical: Platform.OS === "android" ? 5 : 6,
                  borderRadius: 10,
                  backgroundColor: active
                    ? "#ffec21"
                    : "rgba(255,255,255,0.15)",
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? "#fff3a0" : "rgba(255,255,255,0.3)",
                },
                active &&
                  Platform.OS === "ios" && {
                    shadowColor: "#ffec21",
                    shadowOpacity: 0.9,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  },
              ]}
            >
              <AppImage
                source={img}
                contentFit="contain"
                style={{
                  width: FLAG_SIZE.w,
                  height: FLAG_SIZE.h,
                  borderRadius: 4,
                }}
              />
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
