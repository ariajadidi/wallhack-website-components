"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfigurator } from "@/lib/store/configurator";
import { SKUS, type SkuId } from "@/config/skus";

const VALID_IDS = new Set(SKUS.map((s) => s.id));
function isSkuId(v: string | null): v is SkuId {
  return v != null && VALID_IDS.has(v as SkuId);
}

/**
 * Two-way sync between ?sku= URL param and the configurator store.
 *
 * On mount: if URL has a valid ?sku=, hydrate the store.
 * On store change: replace the URL (no scroll, no history push) to match.
 *
 * Uses a ref guard to break the feedback loop where each side updates the other.
 */
export function useSkuUrlSync() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSku = useConfigurator((s) => s.activeSku);
  const setSku = useConfigurator((s) => s.setSku);
  const didHydrate = useRef(false);

  // URL → store, on mount only.
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    const fromUrl = searchParams.get("sku");
    if (isSkuId(fromUrl) && fromUrl !== activeSku) {
      setSku(fromUrl);
    }
  }, [searchParams, activeSku, setSku]);

  // Store → URL, on activeSku change.
  useEffect(() => {
    if (!didHydrate.current) return;
    const current = searchParams.get("sku");
    if (current === activeSku) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("sku", activeSku);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeSku, router, searchParams]);
}
