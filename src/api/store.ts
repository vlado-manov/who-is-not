import { apiGet, apiPost } from "./client";

export type VerifyReceiptParams = {
  userId: string;
  sku: string;
  platform: "APPLE" | "GOOGLE";
  receipt: string;
  transactionId: string;
  purchaseToken?: string;
  restore?: boolean;
};

export type VerifyReceiptResponse = {
  success: boolean;
  grant?: {
    type: "character" | "bundle" | "subscription";
    unlockedCharacterIds?: string[];
    isPremium?: boolean;
    productIds?: string[];
  };
  error?: string;
};

export async function verifyIapReceipt(
  params: VerifyReceiptParams
): Promise<VerifyReceiptResponse> {
  return apiPost<VerifyReceiptResponse>("/store/verify-receipt", params, {
    skipAuth: false,
  });
}

export type StoreCatalogItem = {
  sku: string;
  type: "character" | "bundle" | "subscription";
  title: string;
  description?: string;
  price: number;
  currency: string;
  /** Character ID if type === 'character' */
  characterId?: string;
  /** Bundle slug if type === 'bundle' */
  bundleSlug?: string;
  /** Hero slugs included in bundle */
  heroSlugs?: string[];
};

export async function fetchStoreCatalog(): Promise<StoreCatalogItem[]> {
  return apiGet<StoreCatalogItem[]>("/store/catalog", { skipAuth: true });
}
