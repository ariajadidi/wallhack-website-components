"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Color, Mesh, MeshPhysicalMaterial } from "three";
import { createEdgeMaterial, createSurfaceMaterial } from "@/config/materials";

type Props = {
  url: string;
  tintColor: string;
};

/**
 * Loads a pad GLB and applies our tunable materials. The scene is cloned per
 * instance so multiple pads at the same URL never fight over single-parent
 * ownership of a THREE.Object3D, and material mutations stay scoped to this
 * instance's clone. Per BUILD_GUIDE §4.
 *
 * Material assignment:
 *   1. material is an array → ONE geometry, two groups: [surface, edge]
 *   2. material.name == "0" → surface ; "1" → edge (Blender default naming)
 *   3. mesh name contains surface/edge/frame/bezel/playing
 *   4. default to surface and warn
 */
export function PadModel({ url, tintColor }: Props) {
  const gltf = useGLTF(url);

  // One material pair per instance, created once.
  const edgeMaterial = useMemo<MeshPhysicalMaterial>(() => createEdgeMaterial(), []);
  const surfaceMaterial = useMemo<MeshPhysicalMaterial>(
    () => createSurfaceMaterial(tintColor),
    // Created once; we mutate color on change below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Live-update the surface color when the configurator changes.
  useEffect(() => {
    surfaceMaterial.color.set(new Color(tintColor));
  }, [tintColor, surfaceMaterial]);

  // Clone the scene + assign materials. Recomputed only if the gltf or
  // material identities change, which is rare (essentially mount-time).
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;

      if (Array.isArray(obj.material)) {
        obj.material = [surfaceMaterial, edgeMaterial];
      } else {
        const matName = (obj.material as { name?: string }).name ?? "";
        const meshName = obj.name.toLowerCase();
        const matLower = matName.toLowerCase();

        if (
          matName === "0" ||
          matLower.includes("surface") ||
          matLower.includes("playing") ||
          meshName.includes("surface") ||
          meshName.includes("playing")
        ) {
          obj.material = surfaceMaterial;
        } else if (
          matName === "1" ||
          matLower.includes("edge") ||
          matLower.includes("frame") ||
          matLower.includes("bezel") ||
          meshName.includes("edge") ||
          meshName.includes("frame") ||
          meshName.includes("bezel")
        ) {
          obj.material = edgeMaterial;
        } else {
          obj.material = surfaceMaterial;
          console.warn(
            `[PadModel] mesh "${obj.name}" (material "${matName}") did not match expected naming — defaulted to surface.`,
          );
        }
      }

      obj.castShadow = true;
      obj.receiveShadow = true;
    });
    return cloned;
  }, [gltf.scene, edgeMaterial, surfaceMaterial]);

  return <primitive object={scene} />;
}

// Pre-warm the asset cache so the page never has to wait for the GLB on first nav.
useGLTF.preload("/models/sp-005.glb");
useGLTF.preload("/models/cr-005.glb");
