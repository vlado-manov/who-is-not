import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";

import CustomButton from "../common/CustomButton";
import CustomText from "../common/CustomText";
import { images } from "../../../assets/images";
import { TT } from "../../constants/tiktokTheme";
import { useAuthStore } from "../../store/useUserStore";
import { fetchDevLoginUsers } from "../../api/users";

const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
  typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

/** Sign-in options for a logged-out profile, as TikTok-style full-width buttons. */
const ProfileLoginComponent = () => {
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);
  const signInEmailPassword = useAuthStore((s) => s.signInEmailPassword);
  const [showLocalSignIn, setShowLocalSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123412341234");
  const [loading, setLoading] = useState(false);
  const [seedUsers, setSeedUsers] = useState<Array<{ name: string; email: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showLocalSignIn) return;
    let active = true;
    fetchDevLoginUsers()
      .then((res) => {
        if (!active) return;
        setSeedUsers(res.items ?? []);
        if (!email && (res.items?.length ?? 0) > 0) {
          setEmail(res.items[0].email);
        }
      })
      .catch(() => {
        if (!active) return;
        setSeedUsers([]);
      });
    return () => {
      active = false;
    };
  }, [showLocalSignIn]);

  const onLocalSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInEmailPassword(email.trim(), password.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <CustomText variant="p" style={styles.intro}>
        Log in to save your progress & unlock achievements
      </CustomText>

      {/* White */}
      <CustomButton
        title="Continue with Google"
        appearance="tertiary"
        fullWidth
        btnSize="md"
        fontSize="sm"
        icon={toSrc(images.googleIcon)}
        iconSize={20}
        onPress={signInGoogle}
      />
      {/* Black with a hairline edge, as Apple's own button */}
      <CustomButton
        title="Continue with Apple"
        fullWidth
        btnSize="md"
        fontSize="sm"
        solidColor="#000000"
        borderColor={TT.chipBorder}
        borderWidth={1}
        iconNode={<AntDesign name="apple" size={20} color={TT.text} />}
        onPress={signInApple}
      />
      <CustomButton
        title="Sign in with email"
        appearance="secondary"
        fullWidth
        btnSize="md"
        fontSize="sm"
        onPress={() => setShowLocalSignIn((v) => !v)}
      />

      {showLocalSignIn ? (
        <View style={styles.form}>
          <CustomText variant="p-small" style={styles.note}>
            Use seeded user email + password 123412341234
          </CustomText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seed user email"
            placeholderTextColor={TT.text2}
            selectionColor={TT.primary}
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="password"
            placeholderTextColor={TT.text2}
            selectionColor={TT.primary}
            style={styles.input}
          />

          {seedUsers.length > 0 ? (
            <View style={styles.seedUsers}>
              {seedUsers.slice(0, 20).map((u) => (
                <TouchableOpacity
                  key={u.email}
                  onPress={() => setEmail(u.email)}
                  style={styles.seedUser}
                >
                  <CustomText variant="p-xsmall">{u.name}</CustomText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {loading ? (
            <ActivityIndicator color={TT.text} />
          ) : (
            <CustomButton
              title="Sign In"
              fullWidth
              btnSize="sm"
              fontSize="sm"
              onPress={() => void onLocalSignIn()}
            />
          )}
          {error ? (
            <CustomText variant="p-small" textColor={TT.primary}>
              {error}
            </CustomText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    // Same side margin as the profile cards.
    marginHorizontal: 16,
    gap: 12,
  },
  intro: {
    textAlign: "center",
    color: TT.text2,
  },
  form: {
    borderRadius: TT.cardRadius,
    backgroundColor: TT.surface,
    padding: 12,
    gap: 10,
  },
  note: {
    color: TT.text2,
  },
  input: {
    height: 44,
    borderRadius: TT.radius,
    backgroundColor: TT.surface2,
    paddingHorizontal: 12,
    color: TT.text,
    fontFamily: "TikTokSans-Medium",
    fontSize: 15,
  },
  seedUsers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  seedUser: {
    borderRadius: TT.radius,
    backgroundColor: TT.surface2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});

export default ProfileLoginComponent;
