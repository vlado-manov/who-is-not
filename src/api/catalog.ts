import { apiGet } from "./client";

export type CatalogProductDto = {
  id: string;
  productId: string;
  slug: string;
  title: string;
  description: string | null;
  itemType: string;
  itemRefId: string | null;
  price: number;
  discountPrice: number | null;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export async function fetchCatalogCharacterProducts(): Promise<
  CatalogProductDto[]
> {
  const rows = await apiGet<CatalogProductDto[]>(
    "/catalog/products?type=CHARACTER&active=true",
    {
    skipAuth: true,
    parse: (input: unknown) => {
      if (!Array.isArray(input)) return [];
      return input as CatalogProductDto[];
    },
  }
  );
  return rows.filter((r) => r.itemRefId);
}
