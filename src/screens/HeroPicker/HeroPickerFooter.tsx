import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomText from "../../components/common/CustomText";
import CustomButton from "../../components/common/CustomButton";
import CustomInput from "../../components/common/CustomInput";
import { backgrounds } from "../../../assets/backgrounds";
import { ICharacter } from "../../types/character";
import { useTranslation } from "react-i18next";

type Props = {
  hero: ICharacter;

  isNaming: boolean;
  playerName: string;
  disabled: boolean;

  onChangeName: (v: string) => void;
  onConfirm: () => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  styles: any;
  style: any;
  /** Клавиатура: вдига целия футър (плочка + CTA) над клавиатурата. */
  keyboardLiftStyle?: object;
  inputRef?: React.Ref<any>;
};

export function HeroPickerFooter({
  hero,
  isNaming,
  playerName,
  disabled,
  onChangeName,
  onConfirm,
  onInputFocus,
  onInputBlur,
  styles,
  style,
  keyboardLiftStyle,
  inputRef,
}: Props) {
  const { t } = useTranslation();
  const isNameValid =
    playerName.trim().length >= 3 && playerName.trim().length <= 8;
  const isLocked = !hero.unlocked;

  const ctaTitle = isLocked
    ? t("unlock_for_price", { price: (hero.price / 100).toFixed(2) })
    : isNaming
      ? t("done_btn")
      : t("this_is_me");

  const ctaDisabled = disabled || (isNaming && !isNameValid);

  return (
    <Animated.View style={[styles.heroFooterWrap, style, keyboardLiftStyle]}>
      <View style={[styles.namePlateShadow, { width: "100%" }]}>
        <LinearGradient
          colors={["#FFF7EC", "#F3E1C8"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.namePlate, namePlateStyles.plate]}
        >
          <View
            style={[namePlateStyles.textBlock, { opacity: isNaming ? 0 : 1 }]}
            pointerEvents={isNaming ? "none" : "auto"}
          >
            <CustomText
              variant="h5-headline"
              className="text-center"
              textColor="#592410"
            >
              {hero.name.toUpperCase()}
            </CustomText>

            <View style={styles.nameDivider} />

            <CustomText
              variant="p"
              className="text-center w-full"
              textColor="#762a05"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {hero.description}
            </CustomText>
          </View>

          <View
            style={[namePlateStyles.inputLayer, { opacity: isNaming ? 1 : 0 }]}
            pointerEvents={isNaming ? "auto" : "none"}
          >
            <CustomInput
              ref={inputRef}
              value={playerName}
              onChangeText={onChangeName}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              maxLength={8}
              autoFocus={false}
              unstyled
              style={namePlateStyles.input}
              editable={!disabled}
              returnKeyType="done"
              onSubmitEditing={onConfirm}
            />
          </View>
        </LinearGradient>
      </View>

      <View style={[styles.heroCtaWrap, ctaWrapStyles.wrap]}>
        <CustomButton
          title={ctaTitle}
          btnSize={isNaming ? "md" : "sm"}
          fontSize={isNaming ? "md" : "sm"}
          fullWidth
          horizontalPadding={28}
          onPress={onConfirm}
          disabled={ctaDisabled}
          backgroundImage={backgrounds.bg026}
          shadowColor="#005f07"
        />
      </View>
    </Animated.View>
  );
}

const namePlateStyles = StyleSheet.create({
  plate: {
    position: "relative",
    width: "100%",
    maxWidth: "90%",
    marginHorizontal: "auto",
  },
  textBlock: {
    width: "100%",
    alignItems: "center",
  },
  inputLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  input: {
    width: "100%",
    minHeight: 56,
    fontSize: 28,
    textAlign: "center",
  },
});

const ctaWrapStyles = StyleSheet.create({
  wrap: {
    width: "100%",
    paddingHorizontal: 16,
  },
});
