import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import UserSettingsModal from "../components/modals/UserSettingsModal";

export type OpenUserSettingsOptions = {
  fromHeroPicker?: boolean;
  onHeroSetupExit?: () => void;
};

type ContextValue = {
  openUserSettings: (opts?: OpenUserSettingsOptions) => void;
  closeUserSettings: () => void;
};

const UserSettingsModalContext = createContext<ContextValue | null>(null);

export function UserSettingsModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<OpenUserSettingsOptions>({});

  const closeUserSettings = useCallback(() => {
    setVisible(false);
    setOptions({});
  }, []);

  const openUserSettings = useCallback((opts?: OpenUserSettingsOptions) => {
    setOptions(opts ?? {});
    setVisible(true);
  }, []);

  const value = useMemo(
    () => ({ openUserSettings, closeUserSettings }),
    [openUserSettings, closeUserSettings],
  );

  return (
    <UserSettingsModalContext.Provider value={value}>
      {children}
      <UserSettingsModal
        visible={visible}
        onClose={closeUserSettings}
        fromHeroPicker={options.fromHeroPicker === true}
        onHeroSetupExit={options.onHeroSetupExit}
      />
    </UserSettingsModalContext.Provider>
  );
}

export function useUserSettingsSheet(): ContextValue {
  const ctx = useContext(UserSettingsModalContext);
  if (!ctx) {
    throw new Error(
      "useUserSettingsSheet must be used within UserSettingsModalProvider",
    );
  }
  return ctx;
}
