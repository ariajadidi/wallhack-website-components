import { SKUS, SKU_INDEX_BY_ID, type SkuId } from "./skus";

/**
 * Scene layout — pads sit static on the floor along a diagonal row that
 * recedes from lower-left (foreground) to upper-right (background) on screen.
 * The camera dollies between pad world-positions; the focused pad is always
 * dead-center because the camera looks at exactly the active pad's position
 * (no offset bias).
 *
 * The 45° down look angle is preserved through every transition because the
 * camera offset relative to the active pad — (0, height, depth) in world
 * units — never changes.
 */
export const PAD_SPACING = 0.62;
/**
 * Camera at 30° below horizontal. height = sin(30°) * distance, depth =
 * cos(30°) * distance. Distance chosen so a 0.5m pad fills the same fraction
 * of the frame as before, given the near-orthographic FOV in Studio.tsx.
 */
export const CAM_HEIGHT = 1.17;
export const CAM_DEPTH = 2.03;
/** lookAt Y — push pad up in frame. More negative = pad sits higher. */
export const LOOKAT_Y = -0.06;

/** Row yaw around world Y. 30° gives a comfortable diagonal recede. */
export const ROW_YAW = Math.PI / 6;
const COS_YAW = Math.cos(ROW_YAW);
const SIN_YAW = Math.sin(ROW_YAW);

export type Vec3 = [number, number, number];

/** World position for the pad at `skuIndex`, centered around the origin. */
export function padPosition(skuIndex: number): Vec3 {
  const t = (skuIndex - (SKUS.length - 1) / 2) * PAD_SPACING;
  return [t * COS_YAW, 0, -t * SIN_YAW];
}

export function padPositionById(id: SkuId): Vec3 {
  return padPosition(SKU_INDEX_BY_ID[id]);
}
