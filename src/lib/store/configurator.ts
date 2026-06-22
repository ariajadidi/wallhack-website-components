"use client";

import { create } from "zustand";
import { SKUS, type ColorOption, type SkuId, type SurfaceType } from "@/config/skus";

type ConfiguratorState = {
  activeSku: SkuId;
  colorBySku: Record<SkuId, ColorOption>;
  setSku: (id: SkuId) => void;
  setColor: (id: SkuId, color: ColorOption) => void;
  setSurface: (surface: SurfaceType) => void;
};

const initialColors = SKUS.reduce(
  (acc, s) => ({ ...acc, [s.id]: s.defaultColor }),
  {} as Record<SkuId, ColorOption>,
);

export const useConfigurator = create<ConfiguratorState>((set, get) => ({
  activeSku: SKUS[0].id,
  colorBySku: initialColors,
  setSku: (id) => set({ activeSku: id }),
  setColor: (id, color) =>
    set((s) => ({ colorBySku: { ...s.colorBySku, [id]: color } })),
  setSurface: (surface) => {
    const target = SKUS.find((s) => s.surfaceType === surface);
    if (target && target.id !== get().activeSku) set({ activeSku: target.id });
  },
}));
