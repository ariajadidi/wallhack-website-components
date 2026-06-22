"use client";

import { useEffect, useRef } from "react";
import { SKUS, SKU_INDEX_BY_ID } from "@/config/skus";
import { useConfigurator } from "@/lib/store/configurator";

/** Threshold (px or px/ms) above which a horizontal pointer drag becomes a SKU swipe. */
const SWIPE_DISTANCE = 70;
const SWIPE_VELOCITY = 0.4;

/**
 * Mounts global arrow-key + horizontal-pointer-swipe nav between SKUs.
 *
 * Pointer listeners are attached at the window level so canvas raycasts and
 * UI button clicks still receive their events normally — drags only trigger
 * a SKU change when they exceed the threshold AND the pointer didn't land on
 * an interactive control (we skip when the target is a button/anchor/etc.).
 */
export function useSkuNavigation() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const setSku = useConfigurator((s) => s.setSku);
  const activeRef = useRef(activeSku);
  activeRef.current = activeSku;

  useEffect(() => {
    const cycle = (direction: 1 | -1) => {
      const i = SKU_INDEX_BY_ID[activeRef.current];
      const next = (i + direction + SKUS.length) % SKUS.length;
      setSku(SKUS[next].id);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLElement && /input|textarea|select/i.test(t.tagName)) return;
      if (e.key === "ArrowRight") cycle(1);
      if (e.key === "ArrowLeft") cycle(-1);
    };

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let dragging = false;
    let pointerOverInteractive = false;

    const isInteractive = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return Boolean(el.closest('button, a, input, select, textarea, [role="button"]'));
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
      dragging = true;
      pointerOverInteractive = isInteractive(e.target);
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (pointerOverInteractive) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      // Mostly-vertical → ignore (scrolling intent).
      if (Math.abs(dy) > Math.abs(dx)) return;
      const dt = Math.max(1, performance.now() - startT);
      const vx = Math.abs(dx) / dt;
      const farEnough = Math.abs(dx) > SWIPE_DISTANCE;
      const fastEnough = vx > SWIPE_VELOCITY && Math.abs(dx) > 24;
      if (!farEnough && !fastEnough) return;
      cycle(dx < 0 ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setSku]);
}
