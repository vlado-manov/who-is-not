import React from "react";
import { Pressable, Image, View } from "react-native";
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
    <View className="flex-row overflow-hidden">
      {Object.entries(FLAGS).map(([code, img]) => {
        const active = current.startsWith(code);
        return (
          <Pressable
            key={code}
            onPress={() => setLang(code as Lang)}
            className={`px-2 py-1 ${active ? "bg-white" : ""}`}
          >
            <Image
              source={img}
              style={{ width: 32, height: 20, resizeMode: "contain" }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
