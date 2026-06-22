"use client";

import { useState } from "react";
import { addToCart, createCart, isShopifyConfigured } from "@/lib/shopify/client";
import { SKUS, type ColorOption, type SkuId } from "@/config/skus";
import type { Cart } from "@/lib/shopify/types";

type Status = "idle" | "pending" | "ok" | "error";

const CART_KEY = "wallhack:cart-id";

function readCartId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CART_KEY);
}

function writeCartId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY, id);
}

/**
 * Configurator's cart hook. Resolves the active SKU + color → variant gid,
 * creates a cart on first ADD, appends lines on subsequent ADDs. Stores the
 * cart id in localStorage so the user's session survives reloads.
 *
 * Falls back to the mock Shopify client when env vars are missing — so the
 * ADD button is always interactive, even before Shopify is wired up.
 */
export function useCart() {
  const [status, setStatus] = useState<Status>("idle");
  const [lastCheckoutUrl, setLastCheckoutUrl] = useState<string | null>(null);

  const add = async (skuId: SkuId, color: ColorOption): Promise<Cart> => {
    const sku = SKUS.find((s) => s.id === skuId);
    if (!sku) throw new Error(`unknown sku: ${skuId}`);

    // In live mode, require a real variant gid. In mock mode any token works.
    const variantId = sku.shopify.variants[color];
    const effectiveVariantId =
      variantId ??
      (isShopifyConfigured
        ? null
        : `mock:variant:${skuId}:${color}`);

    if (!effectiveVariantId) {
      throw new Error(
        `${sku.label} (${color}) has no Shopify variant configured yet`,
      );
    }

    setStatus("pending");
    try {
      const existingCartId = readCartId();
      const cart = existingCartId
        ? await addToCart(existingCartId, effectiveVariantId)
        : await createCart(effectiveVariantId);
      writeCartId(cart.id);
      setLastCheckoutUrl(cart.checkoutUrl);
      setStatus("ok");
      return cart;
    } catch (e) {
      setStatus("error");
      throw e;
    }
  };

  return { add, status, lastCheckoutUrl, isShopifyConfigured };
}
