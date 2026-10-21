import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { captureRef } from "react-native-view-shot";

import CamCaption from "./CamCaption";
import { CAM_LAYOUT, CAM_TIMING } from "../../screens/Cam/cam.constants";

export type CamComposeJob = {
  uri: string;
  caption: string;
  /** Called with the new file, or null when composing failed. */
  onDone: (uri: string | null) => void;
};

type Props = {
  job: CamComposeJob;
  frame: { width: number; height: number };
  topInset: number;
};

/**
 * Burns a caption into a round photo: the photo and the caption are laid out
 * off screen exactly as they looked on screen, then captured into a new image,
 * so saved and shared photos carry their text.
 */
export default function CamPhotoComposer({ job, frame, topInset }: Props) {
  const viewRef = useRef<View>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const finish = (uri: string | null) => {
    if (doneRef.current) return;
    doneRef.current = true;
    job.onDone(uri);
  };

  useEffect(() => {
    // Never leave the round waiting on a photo that will not load.
    const guard = setTimeout(() => finish(null), CAM_TIMING.composeTimeoutMs);
    return () => {
      clearTimeout(guard);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // One job per mount (the composer is keyed by the photo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capture = () => {
    // The caption measures its lines after the first layout; wait for that.
    timerRef.current = setTimeout(() => {
      captureRef(viewRef, { format: "jpg", quality: 0.9, result: "tmpfile" })
        .then(finish)
        .catch((e) => {
          console.warn("cam: failed to add the caption to the photo", e);
          finish(null);
        });
    }, CAM_TIMING.composeSettleMs);
  };

  return (
    <View
      ref={viewRef}
      collapsable={false}
      pointerEvents="none"
      style={[
        styles.offscreen,
        { width: frame.width, height: frame.height, left: -frame.width * 2 },
      ]}
    >
      <Image
        source={{ uri: job.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        onLoad={capture}
        onError={() => finish(null)}
      />
      <View style={{ paddingTop: topInset + CAM_LAYOUT.captionTop }}>
        <CamCaption text={job.caption} size="xl" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    top: 0,
  },
});
