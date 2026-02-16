import React from "react";
import { Pressable, Image, View, Platform } from "react-native";
import { useTranslation } from "react-i18next";

type Lang = "bg" | "en" | "fr" | "es";

const FLAGS: Record<Lang, any> = {
  en: require("../../assets/images/flags/en.png"),
  fr: require("../../assets/images/flags/fr.png"),
  es: require("../../assets/images/flags/es.png"),
  bg: require("../../assets/images/flags/bg.png"),
};

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = (i18n.language as Lang) ?? "en";

  const setLang = (lng: Lang) => {
    if (lng !== current) i18n.changeLanguage(lng);
  };

  return (
    <View className="flex-row">
      {Object.entries(FLAGS).map(([code, img]) => {
        const active = current.startsWith(code);

        return (
          <View key={code} style={{ marginHorizontal: 4 }}>
            {/* Glow halo (works everywhere) */}
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
                  paddingHorizontal: 10,
                  paddingVertical: 6,
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
              <Image
                source={img}
                style={{
                  width: 32,
                  height: 20,
                  resizeMode: "contain",
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
