"use client";

import { Shadow } from "@react-three/drei";
import { Pad } from "./Pad";
import { PadLabel } from "./PadLabel";
import type { Sku } from "@/config/skus";

type Props = {
  sku: Sku;
  position: [number, number, number];
  isActive: boolean;
  tintColor: string;
  onPick: () => void;
};

/**
 * One pad sitting static on the floor. Click → activates. Hover on a non-active
 * pad shows a pointer cursor. Animation is owned by CameraDolly, not the pad.
 */
export function PadInstance({
  sku,
  position,
  isActive,
  tintColor,
  onPick,
}: Props) {
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!isActive) onPick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!isActive) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <Pad url={sku.glbUrl} tintColor={tintColor} />
      {/* Fake drop shadow — flat plane with a radial-gradient alpha. Sits
          just below the pad's bottom face (GLB authors pad bottom at
          y≈0.00013). Scale roughly matches the pad's footprint + a touch of
          spill so the falloff reads soft. */}
      <Shadow
        position={[0, -0.0005, 0]}
        scale={[0.62, 0.55, 1]}
        color="#000000"
        colorStop={0.25}
        opacity={0.5}
      />
      <PadLabel
        label={sku.label}
        sub={`${sku.surfaceType} surface`}
        visible={!isActive}
      />
    </group>
  );
}
