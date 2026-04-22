// src/screens/StoreScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  ImageBackground,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { navigateBackSafe } from "../navigation/navigateBackSafe";
import { StackNavigationProp } from "@react-navigation/stack";
import { useQuery } from "@tanstack/react-query";

import { backgrounds } from "../../assets/backgrounds";
import CustomText from "../components/common/CustomText";
import PremiumComponent from "../components/store/PremiumComponent";
import HeroSliderComponent from "../components/store/HeroSliderComponent";
import LoadingComponent from "../components/store/LoadingComponent";
import SuccessComponent from "../components/store/SuccessComponent";
import { OnboardingStackParamList } from "../navigation/types";
import { ICharacter } from "../types/character";
import BundleSliderComponent from "../components/store/BundleSliderComponent";
import { BUNDLES } from "../data/bundles";
import PackSliderComponent from "../components/store/PackSliderComponent";
import { PACKS } from "../data/packs";
import ScreenTopBar from "../components/common/ScreenTopBar";
import { useResponsive } from "../utils/responsive";
import { useHeroesStore } from "../store/useHeroesStore";
import { fetchCatalogCharacterProducts } from "../api/catalog";
import { queryKeys } from "../api/queryKeys";
import { useAuthStore } from "../store/useUserStore";
import { IBundle } from "../types/bundle";
import { IPack } from "../types/pack";
import { trackItemPurchased } from "../api/analytics";

type Nav = StackNavigationProp<OnboardingStackParamList, "Store">;

/** Hero with optional productId for purchase; price from catalog when available (catalog price is cents). */
export type StoreHeroItem = ICharacter & {
  productId?: string;
  currency?: string;
};

const StoreScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { horizontalPadding, topIconSize } = useResponsive();
  const userId = useAuthStore((s) => s.user.id);

  const [loading, setLoading] = useState(false);
  const [successHero, setSuccessHero] = useState<ICharacter | null>(null);

  const heroes = useHeroesStore((s) => s.heroes);
  const { data: catalogProducts = [] } = useQuery({
    queryKey: queryKeys.catalogCharacterProducts,
    queryFn: fetchCatalogCharacterProducts,
    staleTime: 5 * 60_000,
  });

  const paidHeroes = useMemo((): StoreHeroItem[] => {
    const byCharId = new Map(
      catalogProducts
        .filter((p) => p.itemRefId)
        .map((p) => [
          p.itemRefId!,
          {
            productId: p.productId,
            price: p.price / 100,
            discountPrice: p.discountPrice != null ? p.discountPrice / 100 : 0,
            currency: p.currency,
          },
        ]),
    );
    return heroes
      .filter((h) => !h.free && !h.unlocked)
      .map((h) => {
        const cat = byCharId.get(h.id);
        return {
          ...h,
          productId: cat?.productId,
          ...(cat && {
            price: cat.price,
            discountPrice: cat.discountPrice,
          }),
        };
      });
  }, [heroes, catalogProducts]);

  const handleBuy = async (hero: StoreHeroItem) => {
    try {
      setLoading(true);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1200));
      setSuccessHero(hero);
      void trackItemPurchased({
        playerId: userId,
        userId,
        itemType: "character",
        itemId: hero.productId ?? hero.id,
        price: hero.discountPrice > 0 ? hero.discountPrice : hero.price,
        currency: hero.currency ?? "USD",
        quantity: 1,
      }).catch((e) => {
        console.warn("track ITEM_PURCHASED(character) failed", e);
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePremiumBuy = () => {
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "subscription",
      itemId: "premium_monthly",
      price: 5.99,
      currency: "USD",
      quantity: 1,
      metadata: { source: "premium_component" },
    }).catch((e) => {
      console.warn("track ITEM_PURCHASED(premium) failed", e);
    });
  };

  const handleBundleBuy = (bundle: IBundle) => {
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "bundle",
      itemId: bundle.productId ?? bundle.id,
      price: bundle.discountPrice > 0 ? bundle.discountPrice : bundle.price,
      currency: bundle.currency,
      quantity: 1,
    }).catch((e) => {
      console.warn("track ITEM_PURCHASED(bundle) failed", e);
    });
  };

  const handlePackBuy = (pack: IPack) => {
    void trackItemPurchased({
      playerId: userId,
      userId,
      itemType: "pack",
      itemId: pack.productId ?? pack.id,
      price: pack.price,
      currency: pack.currency,
      quantity: 1,
      metadata: { questionsNum: pack.questionsNum },
    }).catch((e) => {
      console.warn("track ITEM_PURCHASED(pack) failed", e);
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["bottom", "left", "right"]}>
        <ImageBackground
          source={backgrounds.bg023}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <ScreenTopBar
            variant="soloBackFromCenter"
            horizontalPadding={horizontalPadding}
            topIconSize={topIconSize}
            showBack
            onSettings={() => {}}
            onProfile={() => {}}
            onBack={() => navigateBackSafe(navigation)}
            backAccessibilityLabel={t("back_btn")}
          />
        <ScrollView contentContainerStyle={{ paddingTop: 72, paddingBottom: 48 }}>
          <View className="items-center w-full justify-center px-4 mt-2">
            <CustomText variant="h3-headline" className="text-center w-full">
              {t("menu_store_heading_01")}
            </CustomText>
            <CustomText variant="h3" className="-rotate-3 text-center w-full">
              {t("menu_store_heading_02")}
            </CustomText>
          </View>

          <PremiumComponent onSelect={handlePremiumBuy} />

          <HeroSliderComponent
            data={paidHeroes}
            itemSize={164}
            gap={0}
            sidePadding={16}
            onSelect={handleBuy}
          />
          <BundleSliderComponent
            title={t("special_offers")}
            data={BUNDLES}
            onSelect={handleBundleBuy}
          />
          <PackSliderComponent
            title={t("step_up_game")}
            data={PACKS}
            onSelect={handlePackBuy}
          />
        </ScrollView>

        {loading && <LoadingComponent />}
        {successHero && (
          <SuccessComponent
            visible={!!successHero}
            hero={successHero}
            onContinue={() => setSuccessHero(null)}
          />
        )}
      </ImageBackground>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
  safe: { flex: 1, backgroundColor: "transparent" },
});

export default StoreScreen;
