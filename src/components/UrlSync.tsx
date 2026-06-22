"use client";

import { useSkuUrlSync } from "@/hooks/useSkuUrlSync";

/** Headless mounting point for the URL ↔ store sync. */
export function UrlSync() {
  useSkuUrlSync();
  return null;
}
