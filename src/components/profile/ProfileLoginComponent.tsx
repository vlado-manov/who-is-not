import {
  View,
  TouchableOpacity,
  ImageSourcePropType,
  Image,
} from "react-native";
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import CustomText from "../common/CustomText";
import { images } from "../../../assets/images";
import { useAuthStore } from "../../store/useUserStore";

const ProfileLoginComponent = () => {
  const toSrc = (img: string | ImageSourcePropType): ImageSourcePropType =>
    typeof img === "string" ? { uri: img } : (img as ImageSourcePropType);

  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInApple = useAuthStore((s) => s.signInApple);

  return (
    <View className="py-12 px-8 items-center justify-center">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={signInGoogle}
        className="max-w-[88%] w-full flex-row items-center justify-center rounded-2xl bg-white py-6 shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
      >
        <Image
          source={toSrc(images.googleIcon)}
          resizeMode="contain"
          className="w-[22px] h-[22px]"
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
      <CustomText className="text-center font-opensans-bold mt-6">
        Log in to save your progress & unlock achievements
      </CustomText>
    </View>
  );
};

export default ProfileLoginComponent;
