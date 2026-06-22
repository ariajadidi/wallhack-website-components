"use client";

import { useControls, folder } from "leva";

/**
 * leva-driven lighting controls. Mounted in the DOM (via leva's auto-panel)
 * and read by StudioRig + the canvas for the HDR rotation/intensity. Pass
 * `?leva=1` or just open the page — the leva panel auto-mounts in the corner
 * during development.
 *
 * Returns plain values; the components apply them. This keeps the lighting
 * config in one place and lets the user iterate without code edits.
 */
export function useLightingControls() {
  return useControls({
    Environment: folder(
      {
        hdriIntensity: { value: 1.0, min: 0, max: 3, step: 0.05 },
        hdriRotationY: {
          value: 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: "rotation (y)",
        },
        toneMappingExposure: { value: 1.0, min: 0.3, max: 2, step: 0.05 },
      },
      { collapsed: false },
    ),

    Ambient: folder(
      {
        hemisphereIntensity: { value: 0.25, min: 0, max: 2, step: 0.05 },
        ambientIntensity: { value: 0.15, min: 0, max: 2, step: 0.05 },
      },
      { collapsed: true },
    ),

    Key: folder(
      {
        keyIntensity: { value: 1.6, min: 0, max: 6, step: 0.1 },
        keyPosition: {
          value: { x: 3.5, y: 6, z: 4 },
          step: 0.1,
        },
      },
      { collapsed: true },
    ),

    Fill: folder(
      {
        fillIntensity: { value: 0.6, min: 0, max: 4, step: 0.1 },
        fillPosition: {
          value: { x: -4, y: 3, z: 2 },
          step: 0.1,
        },
      },
      { collapsed: true },
    ),

    Rim: folder(
      {
        rimIntensity: { value: 0.9, min: 0, max: 4, step: 0.1 },
        rimPosition: {
          value: { x: 0, y: 5, z: -4 },
          step: 0.1,
        },
      },
      { collapsed: true },
    ),

    Kicker: folder(
      {
        kickerIntensity: { value: 0.35, min: 0, max: 4, step: 0.05 },
        kickerPosition: {
          value: { x: 2.5, y: 2, z: -2.5 },
          step: 0.1,
        },
      },
      { collapsed: true },
    ),
  });
}

export type LightingControls = ReturnType<typeof useLightingControls>;
