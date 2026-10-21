import React, { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";

import CamGalleryVideo from "./CamGalleryVideo";
import CamIconButton from "./CamIconButton";
import CamText from "./CamText";
import type { CamMedia } from "../../screens/Cam/cam.types";
import type { CamSaveStatus } from "../../screens/Cam/useCamGame";

type Props = {
  items: CamMedia[];
  frame: { width: number; height: number };
  insets: { top: number; bottom: number };
  saveStatus: CamSaveStatus;
  onSave: () => void;
  onClose: () => void;
};

const ACTION_SIZE = 46;
/** Clears the video timeline at the bottom. */
const ACTIONS_BOTTOM = 72;

const SHARE_TYPES = {
  photo: { mimeType: "image/jpeg", UTI: "public.jpeg" },
  video: { mimeType: "video/mp4", UTI: "public.mpeg-4" },
} as const;

/**
 * Full-screen swipeable viewer for the photos and videos of one or all rounds,
 * with a TikTok-like column of actions on the right: mute, share, save.
 */
export default function CamGallery({
  items,
  frame,
  insets,
  saveStatus,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const current = items[Math.min(index, items.length - 1)];

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / frame.width));

  /** System share sheet: TikTok, Instagram, Facebook, Messenger, Viber and so on. */
  const share = async () => {
    if (!current) return;
    try {
      await Sharing.shareAsync(current.uri, {
        ...SHARE_TYPES[current.kind],
        dialogTitle: t("cam_share"),
      });
    } catch (e) {
      console.warn("cam: sharing failed", e);
    }
  };

  const saveIcon =
    saveStatus === "saved"
      ? "checkmark"
      : saveStatus === "denied" || saveStatus === "failed"
        ? "alert-circle-outline"
        : "download-outline";
  const saveNote =
    saveStatus === "saved"
      ? t("cam_photos_saved")
      : saveStatus === "denied" || saveStatus === "failed"
        ? t("cam_save_failed")
        : null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <FlatList
        data={items}
        keyExtractor={(item, i) => `${i}-${item.uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({
          length: frame.width,
          offset: frame.width * i,
          index: i,
        })}
        renderItem={({ item, index: itemIndex }) => (
          <View style={{ width: frame.width, height: frame.height }}>
            {item.kind === "video" ? (
              <CamGalleryVideo
                uri={item.uri}
                active={itemIndex === index}
                muted={muted}
                bottomInset={insets.bottom}
              />
            ) : (
              <Image
                source={{ uri: item.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
              />
            )}
          </View>
        )}
      />

      <View style={[styles.top, { top: insets.top + 6 }]}>
        <CamIconButton
          icon="close"
          size={36}
          accessibilityLabel={t("cam_gallery_close")}
          onPress={onClose}
        />
        {current && (
          <CamText variant="body" shadow>
            {`${t("cam_gallery_round", { n: current.round })} · ${index + 1}/${items.length}`}
          </CamText>
        )}
        <View style={styles.topSpacer} />
      </View>
      {saveNote && (
        <View style={[styles.note, { top: insets.top + 52 }]}>
          <CamText variant="subtitle" center shadow>
            {saveNote}
          </CamText>
        </View>
      )}

      <View style={[styles.actions, { bottom: insets.bottom + ACTIONS_BOTTOM }]}>
        {current?.kind === "video" && (
          <CamIconButton
            icon={muted ? "volume-mute" : "volume-high"}
            size={ACTION_SIZE}
            accessibilityLabel={
              muted ? t("cam_video_unmute") : t("cam_video_mute")
            }
            onPress={() => setMuted((m) => !m)}
          />
        )}
        <CamIconButton
          icon="arrow-redo"
          size={ACTION_SIZE}
          accessibilityLabel={t("cam_share")}
          onPress={() => void share()}
        />
        <CamIconButton
          icon={saveIcon}
          size={ACTION_SIZE}
          accessibilityLabel={t("cam_save_photos")}
          onPress={() => {
            if (saveStatus !== "saving" && saveStatus !== "saved") onSave();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#000000",
  },
  top: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topSpacer: {
    width: 36,
  },
  note: {
    position: "absolute",
    left: 24,
    right: 24,
  },
  actions: {
    position: "absolute",
    right: 12,
    gap: 14,
  },
});
