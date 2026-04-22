import { Animated, View } from "react-native";
import { createHeroPickerStyles } from "../styles/heroPicker.styles";
import { ImageBackground } from "react-native";
import { backgrounds } from "../../../assets/backgrounds";

type Props = {
  children: React.ReactNode;
  showOverlay: boolean;
  overlayOpacity: Animated.Value;
  styles: ReturnType<typeof createHeroPickerStyles>;
};

export function HeroPickerBackground({
  children,
  showOverlay,
  overlayOpacity,
  styles,
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
        {children}
      </View>
    </ImageBackground>
  );
}

export default HeroPickerBackground;
