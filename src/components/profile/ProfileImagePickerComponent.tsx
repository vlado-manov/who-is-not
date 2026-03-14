import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StyleSheet,
  ImageBackground,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useIconPressAnim } from "../../hooks/useIconPressAnim";

const AnimatedImage = Animated.createAnimatedComponent(Image);
import CustomText from "../common/CustomText";
import { EvilIcons } from "@expo/vector-icons";
import CustomButton from "../common/CustomButton";
import SingleProfileImagePickerComponent from "./SingleProfileImagePickerComponent";
import { useHeroesStore } from "../../store/useHeroesStore";
import { useAuthStore } from "../../store/useUserStore";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { backgrounds } from "../../../assets/backgrounds";
import { game_images } from "../../../assets/images";

const CARD_WIDTH = 132;
const SEPARATOR = 24;
const ITEM_LAYOUT = CARD_WIDTH + SEPARATOR;

type Props = {
  setImagePickerVisible: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ProfileImagePickerComponent({
  setImagePickerVisible,
}: Props) {
  const { t } = useTranslation();
  const heroes = useHeroesStore((s) => s.heroes);
  const userAvatarId = useAuthStore((s) => s.user.avatarId);
  const listRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const leftArrowAnim = useIconPressAnim();
  const rightArrowAnim = useIconPressAnim();

  const close = () => setImagePickerVisible(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const goPrev = () => {
    const next = Math.max(0, currentIndex - 1);
    setCurrentIndex(next);
    listRef.current?.scrollToOffset({
      offset: next * ITEM_LAYOUT,
      animated: true,
    });
  };

  const goNext = () => {
    const next = Math.min(heroes.length - 1, currentIndex + 1);
    setCurrentIndex(next);
    listRef.current?.scrollToOffset({
      offset: next * ITEM_LAYOUT,
      animated: true,
    });
  };

  const getItemLayout = (_: unknown, index: number) => ({
    length: ITEM_LAYOUT,
    offset: index * ITEM_LAYOUT,
    index,
  });

  const onMomentumScrollEnd = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_LAYOUT);
    setCurrentIndex(Math.min(idx, heroes.length - 1));
  };

  if (heroes.length === 0) return null;

  return (
    <Pressable style={styles.backdrop} onPress={close}>
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={close}
        activeOpacity={0.8}
      >
        <EvilIcons name="close" size={36} color="rgba(255,255,255,0.95)" />
      </TouchableOpacity>

      <TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.modalWrap,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.namePlateShadow}>
            <ImageBackground
              source={backgrounds.bg005}
              resizeMode="stretch"
              imageStyle={{ borderRadius: 18 }}
              style={styles.namePlate}
            >
              <CustomText
                variant="p"
                className="text-center"
                textColor="#762a05"
              >
                {t("pick_profile_image")}
              </CustomText>

              <View style={styles.nameDivider} />

              <View style={styles.carouselRow}>
                <FlatList
                  ref={listRef}
                  data={heroes}
                  horizontal
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: SEPARATOR }} />
                  )}
                  getItemLayout={getItemLayout}
                  onMomentumScrollEnd={onMomentumScrollEnd}
                  onScrollToIndexFailed={() => {}}
                  renderItem={({ item }) => (
                    <SingleProfileImagePickerComponent
                      item={item}
                      selected={item.slug === userAvatarId}
                    />
                  )}
                />
                <LinearGradient
                  colors={["rgba(240,201,10,0.25)", "transparent"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.fadeLeft, styles.fadeGradient]}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", "rgba(240,201,10,0.25)"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.fadeRight, styles.fadeGradient]}
                  pointerEvents="none"
                />
                <Pressable
                  onPress={goPrev}
                  onPressIn={leftArrowAnim.pressIn}
                  onPressOut={leftArrowAnim.pressOut}
                  style={[
                    styles.arrowLeft,
                    currentIndex === 0 && styles.arrowDisabled,
                  ]}
                  hitSlop={16}
                >
                  <AnimatedImage
                    source={game_images.leftArrow}
                    style={[{ width: 52, height: 50 }, leftArrowAnim.style]}
                    contentFit="contain"
                  />
                </Pressable>
                <Pressable
                  onPress={goNext}
                  onPressIn={rightArrowAnim.pressIn}
                  onPressOut={rightArrowAnim.pressOut}
                  style={[
                    styles.arrowRight,
                    currentIndex >= heroes.length - 1 && styles.arrowDisabled,
                  ]}
                  hitSlop={16}
                >
                  <AnimatedImage
                    source={game_images.rightArrow}
                    style={[{ width: 52, height: 50 }, rightArrowAnim.style]}
                    contentFit="contain"
                  />
                </Pressable>
              </View>

              <View style={styles.nameDivider} />

              <CustomButton
                title={t("close")}
                onPress={close}
                btnSize="xs"
                buttonClassName="min-w-[140px]"
                backgroundImage={backgrounds.bg026}
                glow
                glowColor="rgba(41,255,25,0.5)"
                shadowColor="#005f07"
              />
            </ImageBackground>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Pressable>
  );
}

const ARROW_ZONE = 56;

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    height: "100%",
    zIndex: 99,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  closeBtn: {
    position: "absolute",
    top: 48,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  modalWrap: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  namePlateShadow: {
    shadowColor: "#fff",
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 14,
    width: "100%",
  },
  namePlate: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 20,
    alignItems: "center",
    shadowColor: "#ffd800",
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(251,192,32,1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(160,110,60,0.7)",
    overflow: "hidden",
  },
  nameDivider: {
    width: "88%",
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(89,36,16,0.5)",
  },
  carouselRow: {
    width: "100%",
    height: 160,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  listContent: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: ARROW_ZONE,
    zIndex: 1,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: ARROW_ZONE,
    zIndex: 1,
  },
  fadeGradient: {
    borderRadius: 0,
  },
  arrowLeft: {
    position: "absolute",
    left: 4,
    top: "50%",
    marginTop: -25,
    zIndex: 2,
    padding: 4,
  },
  arrowRight: {
    position: "absolute",
    right: 4,
    top: "50%",
    marginTop: -25,
    zIndex: 2,
    padding: 4,
  },
  arrowDisabled: {
    opacity: 0.35,
  },
});
