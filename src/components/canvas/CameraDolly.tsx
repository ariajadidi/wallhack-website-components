"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import { Vector3 } from "three";
import { useConfigurator } from "@/lib/store/configurator";
import {
  CAM_DEPTH,
  CAM_HEIGHT,
  LOOKAT_Y,
  padPositionById,
} from "@/config/layout";

/**
 * Owns the camera. The pads sit static along a diagonal row; the camera
 * keeps a constant (0, height, depth) world offset from the active pad,
 * which preserves the 45° down angle and keeps the focused pad dead-center.
 *
 * On active-SKU change, both camera position (x, z) and lookAt (x, z)
 * spring to the new active pad's coordinates in lockstep — height and
 * lookAt-y are fixed, so the camera glides along the diagonal track
 * without re-tilting.
 *
 * Spring config per BUILD_GUIDE §5.3 (mass 1 / tension 80 / friction 26
 * ≈ iOS sheet motion, ~700ms critically damped).
 */
export function CameraDolly() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const [tx, , tz] = padPositionById(activeSku);

  const [spring, api] = useSpring(
    () => ({
      camX: tx,
      camZ: tz + CAM_DEPTH,
      lookX: tx,
      lookZ: tz,
      config: { mass: 1, tension: 80, friction: 26 },
    }),
    [],
  );

  useEffect(() => {
    api.start({
      camX: tx,
      camZ: tz + CAM_DEPTH,
      lookX: tx,
      lookZ: tz,
    });
  }, [tx, tz, api]);

  const lookAtVec = useRef(new Vector3(tx, LOOKAT_Y, tz));

  useFrame(({ camera }) => {
    camera.position.set(spring.camX.get(), CAM_HEIGHT, spring.camZ.get());
    lookAtVec.current.set(spring.lookX.get(), LOOKAT_Y, spring.lookZ.get());
    camera.lookAt(lookAtVec.current);
  });

  return null;
}
