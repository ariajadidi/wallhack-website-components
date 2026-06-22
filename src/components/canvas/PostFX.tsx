"use client";

import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/**
 * Subtle post pipeline — never loud enough to read as "filter."
 * Per BUILD_GUIDE §3.6.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom
        luminanceThreshold={0.95}
        luminanceSmoothing={0.4}
        intensity={0.12}
        mipmapBlur
      />
      <Vignette
        eskil={false}
        offset={0.5}
        darkness={0.28}
        blendFunction={BlendFunction.NORMAL}
      />
      <SMAA />
    </EffectComposer>
  );
}
