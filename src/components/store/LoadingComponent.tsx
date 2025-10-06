import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import CustomText from "../common/CustomText";
import { images } from "../../../assets/images";

const LoadingComponent = () => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spin.setValue(0);

    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
      { iterations: -1 }
    );

    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.85)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      pointerEvents="auto"
    >
      <Animated.Image
        source={images.loader}
        style={{
          width: 100,
          height: 100,
          transform: [{ rotate }],
        }}
        resizeMode="contain"
      />

      <CustomText variant="h3-headline" className="mt-4 text-white">
        Please wait...
      </CustomText>
    </View>
  );
};

export default LoadingComponent;
