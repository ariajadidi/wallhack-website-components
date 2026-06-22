/**
 * SKU registry — products the user cycles through.
 *
 * `shopify.variants` maps each colorOption to a real Shopify variant gid. When
 * env vars aren't present, the cart layer falls back to a mock implementation
 * (see lib/shopify/client.ts), so the configurator works end-to-end without
 * Shopify credentials configured.
 */
export type SkuId = "sp-005" | "cr-005" | "sp-004a";
export type ColorOption = "black" | "white";
export type SurfaceType = "speed" | "control";

export type Sku = {
  id: SkuId;
  label: string;
  surfaceType: SurfaceType;
  description: string;
  tags: string[];
  glbUrl: string;
  colorOptions: ColorOption[];
  defaultColor: ColorOption;
  price: number;
  currency: string;
  shopify: {
    productHandle: string;
    /** Map color → variant gid (gid://shopify/ProductVariant/...). */
    variants: Record<ColorOption, string | null>;
  };
};

/** Resolved tint hex for each colorOption — only the surface material uses these. */
export const TINT_HEX: Record<ColorOption, string> = {
  black: "#141416",
  white: "#ededea",
};

export const SKUS: Sku[] = [
  {
    id: "sp-005",
    label: "SP-005",
    surfaceType: "speed",
    description:
      "With the SP-005, this legacy reaches new levels of precision and refinement. Evolving from the original SkyPad to today, the SP surface carries Wallhack's heritage as one of the most respected glass pads on the market.",
    tags: ["tracking-heavy games", "hero shooters"],
    glbUrl: "/models/sp-005.glb",
    colorOptions: ["black", "white"],
    defaultColor: "black",
    price: 139,
    currency: "€",
    shopify: {
      productHandle: "sp-005",
      variants: { black: null, white: null },
    },
  },
  {
    id: "cr-005",
    label: "CR-005",
    surfaceType: "control",
    description:
      "The CR-005 is the 5th-generation control surface — microscopic crater structures generate pressure-responsive friction. The harder you press, the more it grips. Built for precise tracking, scoped aim, and deliberate flicks.",
    tags: ["precise tracking", "scoped aim"],
    glbUrl: "/models/cr-005.glb",
    colorOptions: ["black"],
    defaultColor: "black",
    price: 139,
    currency: "€",
    shopify: {
      productHandle: "cr-005",
      variants: { black: null, white: null },
    },
  },
];

export const SKU_INDEX_BY_ID: Record<SkuId, number> = SKUS.reduce(
  (acc, s, i) => ({ ...acc, [s.id]: i }),
  {} as Record<SkuId, number>,
);
