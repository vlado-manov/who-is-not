// ImageBackgroundWithLoadGate
// Показва съдържанието САМО след като background изображението е заредено (onLoad).
// Гарантира, че потребителят никога не вижда празен/частичен екран.
import React, { useState, useCallback } from "react";
import {
  ImageBackground,
  View,
  StyleSheet,
  ImageSourcePropType,
  ImageBackgroundProps,
} from "react-native";

type Props = Omit<ImageBackgroundProps, "onLoad"> & {
  /** Fallback при грешка – показваме съдържанието след timeout */
  loadTimeoutMs?: number;
};

export default function ImageBackgroundWithLoadGate({
  children,
  style,
  loadTimeoutMs = 5000,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const onLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const onError = useCallback(() => {
    setErrored(true);
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => setLoaded(true), loadTimeoutMs);
    return () => clearTimeout(t);
  }, [loaded, loadTimeoutMs]);

  const showContent = loaded || errored;

  return (
    <View style={[{ flex: 1 }, style]}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "#000", zIndex: 0 },
        ]}
      />
      <ImageBackground
        {...rest}
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: showContent ? 1 : 0, zIndex: 1 },
        ]}
        onLoad={onLoad}
        onError={onError}
      >
        {showContent ? children : null}
      </ImageBackground>
    </View>
  );
}
