import {
  ActivityIndicator,
  TextInput,
  View,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import AppImage from "../AppImage";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import CustomText from "../common/CustomText";
import { images } from "../../../assets/images";
import { useAuthStore } from "../../store/useUserStore";
import { fetchDevLoginUsers } from "../../api/users";

const ProfileLoginComponent = () => {
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

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
    <View className="py-12 px-8 items-center justify-center">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={signInGoogle}
        className="max-w-[88%] w-full flex-row items-center justify-center rounded-2xl bg-white py-6 shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
      >
        <AppImage
          source={toSrc(images.googleIcon)}
          contentFit="contain"
          className="w-[22px] h-[22px]"
          style={{ width: 22, height: 22 }}
        />
        <CustomText
          variant="p"
          className="ml-3 text-base font-bold"
          textColor="black"
        >
          Continue with Google
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={signInApple}
        className="max-w-[88%] w-full mt-3 flex-row items-center justify-center rounded-2xl bg-black py-6 shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
      >
        <AntDesign name="apple" size={22} color="white" />
        <CustomText variant="p" className="ml-3 text-base font-bold text-white">
          Continue with Apple
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowLocalSignIn((v) => !v)}
        className="max-w-[88%] w-full mt-3 flex-row items-center justify-center rounded-2xl bg-amber-400 py-5 shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
      >
        <CustomText
          variant="p"
          className="text-base font-bold"
          textColor="black"
        >
          Sign In (Seed User)
        </CustomText>
      </TouchableOpacity>

      {showLocalSignIn ? (
        <View className="max-w-[88%] w-full mt-3 rounded-2xl border border-white/30 bg-black/30 p-3">
          <CustomText className="text-xs mb-2 opacity-80">
            Use seeded user email + password 123412341234
          </CustomText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="seed user email"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 9,
              color: "white",
              marginBottom: 8,
            }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="password"
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={{
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.35)",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 9,
              color: "white",
            }}
          />

          {seedUsers.length > 0 ? (
            <View className="mt-2 flex-row flex-wrap gap-2">
              {seedUsers.slice(0, 20).map((u) => (
                <TouchableOpacity
                  key={u.email}
                  onPress={() => setEmail(u.email)}
                  className="rounded-lg bg-white/15 px-2 py-1"
                >
                  <CustomText className="text-[11px]">{u.name}</CustomText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => void onLocalSignIn()}
            disabled={loading}
            className="mt-3 rounded-xl bg-amber-400 py-2.5"
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <CustomText className="text-center font-bold" textColor="black">
                Sign In
              </CustomText>
            )}
          </TouchableOpacity>
          {error ? <CustomText className="mt-2 text-xs text-red-300">{error}</CustomText> : null}
        </View>
      ) : null}
      <CustomText className="text-center font-opensans-bold mt-6">
        Log in to save your progress & unlock achievements
      </CustomText>
    </View>
  );
};

export default ProfileLoginComponent;
