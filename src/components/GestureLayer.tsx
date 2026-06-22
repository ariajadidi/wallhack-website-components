"use client";

import { useSkuNavigation } from "@/hooks/useSkuNavigation";

/** Headless: mounts global keyboard + swipe nav hooks. */
export function GestureLayer() {
  useSkuNavigation();
  return null;
}
