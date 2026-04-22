// ImageBackgroundWithLoadGate
// По подразбиране: съдържанието САМО след като background изображението е заредено (onLoad).
// `showChildrenWhileLoading`: съдържанието е върху слой над картинката — без черен кадър при навигация към екран с вече познат asset.
import React, { useState, useCallback } from "react";
import {
  ImageBackground,
  View,
  StyleSheet,
  ImageBackgroundProps,
} from "react-native";

type Props = Omit<ImageBackgroundProps, "onLoad"> & {
  /** Fallback при грешка – показваме съдържанието след timeout */
  loadTimeoutMs?: number;
  /**
   * Children render веднага в overlay; фонът се появява при onLoad.
   * Ползвай при екрани с честа навигация и същия `source`, за да няма черен blink.
   */
  showChildrenWhileLoading?: boolean;
  /** Под слоя с изображението (по подразбиране #000, или transparent с showChildrenWhileLoading). */
  underlayColor?: string;
};

export default function ImageBackgroundWithLoadGate({
  children,
  style,
  loadTimeoutMs = 5000,
  showChildrenWhileLoading = false,
  underlayColor,
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

  const imageReady = loaded || errored;

  if (showChildrenWhileLoading) {
    const bgUnderlay = underlayColor ?? "transparent";
    return (
      <View style={[{ flex: 1 }, style]}>
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: bgUnderlay, zIndex: 0 },
          ]}
        />
        <ImageBackground
          {...rest}
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: imageReady ? 1 : 0, zIndex: 1 },
          ]}
          onLoad={onLoad}
          onError={onError}
        />
        <View
          style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}
          pointerEvents="box-none"
        >
          {children}
        </View>
      </View>
    );
  }

  const showContent = imageReady;
  return (
    <View style={[{ flex: 1 }, style]}>
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: underlayColor ?? "#000",
            zIndex: 0,
          },
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
