import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CamButton from "../cam/CamButton";
import CamSheet from "../cam/CamSheet";
import CamText from "../cam/CamText";
import CamTextInput from "../cam/CamTextInput";
import { useAuthStore } from "../../store/useUserStore";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const NAME_MAX = 12;

/** Display name editor as a TikTok-style bottom sheet (same look as the settings). */
export default function ProfileChangeNameModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const name = useAuthStore((s) => s.user.name);
  const updateName = useAuthStore((s) => s.updateName);
  const [draft, setDraft] = useState(name ?? "");

  useEffect(() => {
    if (visible) setDraft(name ?? "");
  }, [visible, name]);

  const canSave = useMemo(() => {
    const trimmed = draft.trim();
    return trimmed.length > 0 && trimmed !== (name ?? "");
  }, [draft, name]);

  const onSave = () => {
    if (!canSave) return;
    updateName(draft.trim());
    onClose();
  };

  return (
    <CamSheet
      visible={visible}
      onClose={onClose}
      title={t("profile_change_name_title")}
      closeLabel={t("settings_cancel")}
    >
      <CamText variant="subtitle">{t("profile_change_name_body")}</CamText>
      <CamTextInput
        value={draft}
        onChangeText={setDraft}
        maxLength={NAME_MAX}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={onSave}
      />
      <CamButton title={t("change_name")} disabled={!canSave} onPress={onSave} />
    </CamSheet>
  );
}
