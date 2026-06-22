import { Color, MeshPhysicalMaterial } from "three";

/**
 * Material data — tunable from a single place. Per BUILD_GUIDE §4.
 *
 * Both materials are dielectric glass (metalness 0, ior 1.5, transmission 0
 * because the print/back is opaque). The polished CNC edge gets clearcoat +
 * anisotropy; the matte playing surface gets soft roughness, no clearcoat.
 */

export type EdgeConfig = {
  color: string;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
  anisotropy: number;
  anisotropyRotation: number;
  ior: number;
};

export type SurfaceConfig = {
  color: string;
  roughness: number;
  clearcoat: number;
  envMapIntensity: number;
  ior: number;
};

export const EDGE_CONFIG: EdgeConfig = {
  color: "#0a0a0c",
  // The HDR has bright softboxes — without slight roughness + reduced
  // envMapIntensity, those softboxes blow out as white glow along the
  // bezel's grazing-angle Fresnel. These values keep the polished-glass
  // character without the chrome look.
  roughness: 0.09,
  clearcoat: 0.5,
  clearcoatRoughness: 0.08,
  envMapIntensity: 0.55,
  anisotropy: 0.25,
  anisotropyRotation: Math.PI / 4,
  ior: 1.5,
};

export const SURFACE_CONFIG: SurfaceConfig = {
  color: "#141416",
  roughness: 0.5,
  clearcoat: 0,
  envMapIntensity: 0.55,
  ior: 1.5,
};

export function createEdgeMaterial(): MeshPhysicalMaterial {
  const m = new MeshPhysicalMaterial({
    color: new Color(EDGE_CONFIG.color),
    metalness: 0,
    roughness: EDGE_CONFIG.roughness,
    clearcoat: EDGE_CONFIG.clearcoat,
    clearcoatRoughness: EDGE_CONFIG.clearcoatRoughness,
    envMapIntensity: EDGE_CONFIG.envMapIntensity,
    transmission: 0,
    ior: EDGE_CONFIG.ior,
  });
  // Anisotropy gives the milled-metal/glass stretched highlight character.
  m.anisotropy = EDGE_CONFIG.anisotropy;
  m.anisotropyRotation = EDGE_CONFIG.anisotropyRotation;
  m.name = "wallhack/edge";
  return m;
}

export function createSurfaceMaterial(tintColor: string): MeshPhysicalMaterial {
  const m = new MeshPhysicalMaterial({
    color: new Color(tintColor),
    metalness: 0,
    roughness: SURFACE_CONFIG.roughness,
    clearcoat: SURFACE_CONFIG.clearcoat,
    envMapIntensity: SURFACE_CONFIG.envMapIntensity,
    transmission: 0,
    ior: SURFACE_CONFIG.ior,
  });
  m.name = "wallhack/surface";
  return m;
}
