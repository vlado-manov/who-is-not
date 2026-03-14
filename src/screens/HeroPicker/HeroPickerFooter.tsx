import React from "react";
import { Animated, KeyboardAvoidingView, Platform, View } from "react-native";
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
  inputRef,
}: Props) {
  const { t } = useTranslation();
  const isNameValid =
    playerName.trim().length >= 3 && playerName.trim().length <= 8;
  const isLocked = !hero.unlocked;

  return (
    // <KeyboardAvoidingView
    //   behavior={Platform.OS === "ios" ? "padding" : "height"}
    //   keyboardVerticalOffset={Platform.OS === "ios" ? 140 : 100} // Increased!
    // >
    <Animated.View style={[styles.heroFooterWrap, style]}>
      <View style={styles.namePlateShadow}>
        <LinearGradient
          colors={["#FFF7EC", "#F3E1C8"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.namePlate}
        >
          {!isNaming ? (
            <>
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
                className="text-center"
                textColor="#762a05"
              >
                {hero.description}
              </CustomText>
            </>
          ) : (
            <>
              {/* <CustomText
                variant="h5-headline"
                className="text-center mb-2"
                textColor="#592410"
              >
                {t("hero_picker_they_call_me")}
              </CustomText> */}

              <CustomInput
                ref={inputRef}
                value={playerName}
                onChangeText={onChangeName}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                maxLength={8}
                autoFocus={false}
                unstyled
                style={{
                  minWidth: "40%",
                  minHeight: 56,
                  fontSize: 28,
                  textAlign: "center",
                }}
                editable={!disabled}
                returnKeyType="done"
                onSubmitEditing={onConfirm}
              />
            </>
          )}
        </LinearGradient>
      </View>

      <View style={styles.heroCtaWrap}>
        <CustomButton
          title={
            isLocked
              ? t("unlock_for_price", { price: (hero.price / 100).toFixed(2) })
              : isNaming
                ? t("done_btn")
                : t("this_is_me")
          }
          btnSize={isNaming ? "md" : "sm"}
          fontSize={isNaming ? "md" : "sm"}
          onPress={onConfirm}
          disabled={disabled || (isNaming && !isNameValid)}
          backgroundImage={backgrounds.bg026}
          shadowColor="#005f07"
        />
      </View>
    </Animated.View>
    // </KeyboardAvoidingView>
  );
}
