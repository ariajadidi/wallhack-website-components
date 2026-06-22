"use client";

import { SKUS, TINT_HEX } from "@/config/skus";
import { PAD_SPACING, ROW_YAW } from "@/config/layout";
import { useConfigurator } from "@/lib/store/configurator";
import { PadInstance } from "./PadInstance";

/**
 * Static diagonal row of pads on the floor. The wrapping <group> is yawed by
 * ROW_YAW, which both:
 *   • lays the pad positions along the diagonal in world space, and
 *   • rotates each pad's own long-edge to match that diagonal — so the pads
 *     read as parallel lines pointing into the scene (like the previous
 *     version), not as world-axis-aligned slabs sliding sideways.
 *
 * CameraDolly knows the world positions independently (padPositionById in
 * layout.ts), so the camera tracks each pad through the same rotation.
 */
export function Showroom() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const colorBySku = useConfigurator((s) => s.colorBySku);
  const setSku = useConfigurator((s) => s.setSku);

  return (
    <group rotation={[0, ROW_YAW, 0]}>
      {SKUS.map((sku, i) => {
        const localX = (i - (SKUS.length - 1) / 2) * PAD_SPACING;
        return (
          <PadInstance
            key={sku.id}
            sku={sku}
            position={[localX, 0, 0]}
            isActive={sku.id === activeSku}
            tintColor={TINT_HEX[colorBySku[sku.id] ?? sku.defaultColor]}
            onPick={() => setSku(sku.id)}
          />
        );
      })}
    </group>
  );
}
