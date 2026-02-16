import { Animated, View } from "react-native";
import { createHeroPickerStyles } from "../styles/heroPicker.styles";
import { ImageBackground } from "react-native";
import { backgrounds } from "../../../assets/backgrounds";
import { Image } from "react-native";
import { game_images } from "../../../assets/images";

type Props = {
  children: React.ReactNode;
  showOverlay: boolean;
  overlayOpacity: Animated.Value;
  styles: ReturnType<typeof createHeroPickerStyles>;
  hideBottomArt?: boolean;
};

export function HeroPickerBackground({
  children,
  showOverlay,
  overlayOpacity,
  styles,
  hideBottomArt,
}: Props) {
  return (
    <ImageBackground
      source={backgrounds.bg004}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      {showOverlay && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backgroundOverlay,
            {
              opacity: overlayOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.42],
              }),
            },
          ]}
        />
      )}

      <View style={styles.contentLayer}>
        <View
          style={{
            position: "absolute",
            bottom: -25,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Image
            source={game_images.heroPickerBottom}
            resizeMode="contain"
            style={{
              width: "100%",
              height: "100%",
              opacity: hideBottomArt ? 0 : 1,
            }}
          />
        </View>

        {children}
      </View>
    </ImageBackground>
  );
}

export default HeroPickerBackground;
