import { Animated, View, ImageBackground, StyleSheet } from "react-native";
import { createHeroPickerStyles } from "../styles/heroPicker.styles";
import { backgrounds } from "../../../assets/backgrounds";
import WarmBubblesOverlay from "../../components/WarmBubblesOverlay";

type BackdropProps = {
  showOverlay: boolean;
  overlayOpacity: Animated.Value;
  styles: ReturnType<typeof createHeroPickerStyles>;
};

export function HeroPickerBackdrop({
  showOverlay,
  overlayOpacity,
  styles,
}: BackdropProps) {
  return (
    <ImageBackground
      source={backgrounds.bg004}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <WarmBubblesOverlay variant="normal" />
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
    </ImageBackground>
  );
}

type Props = BackdropProps & {
  children: React.ReactNode;
};

export function HeroPickerBackground({
  children,
  showOverlay,
  overlayOpacity,
  styles,
}: Props) {
  return (
    <View style={{ flex: 1 }}>
      <HeroPickerBackdrop
        showOverlay={showOverlay}
        overlayOpacity={overlayOpacity}
        styles={styles}
      />
      <View style={styles.contentLayer} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

export default HeroPickerBackground;
