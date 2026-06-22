"use client";

import { Environment } from "@react-three/drei";
import type { LightingControls } from "@/lib/store/lighting";

const HDR_URL = "/hdri/studio_small_08_2k.exr";

/**
 * Lighting rig — authored studio HDR for IBL + 4-point directional rig for
 * shaped highlights and the hero contact shadow. All values come from the
 * leva-driven lighting store so artistic direction is live-tweakable.
 *
 * Per BUILD_GUIDE §3.3. To swap to a different HDR, drop a file in
 * /public/hdri/ and change HDR_URL.
 */
export function StudioRig({ controls }: { controls: LightingControls }) {
  return (
    <group>
      <hemisphereLight
        args={["#ffffff", "#d8d8da", controls.hemisphereIntensity]}
      />
      <ambientLight intensity={controls.ambientIntensity} />

      <Environment
        files={HDR_URL}
        background={false}
        resolution={1024}
        environmentIntensity={controls.hdriIntensity}
        environmentRotation={[0, controls.hdriRotationY, 0]}
      />

      {/* Key — strong directional from camera-right above. Casts the hero shadow. */}
      <directionalLight
        position={[
          controls.keyPosition.x,
          controls.keyPosition.y,
          controls.keyPosition.z,
        ]}
        intensity={controls.keyIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
      />
      <directionalLight
        position={[
          controls.fillPosition.x,
          controls.fillPosition.y,
          controls.fillPosition.z,
        ]}
        intensity={controls.fillIntensity}
      />
      <directionalLight
        position={[
          controls.rimPosition.x,
          controls.rimPosition.y,
          controls.rimPosition.z,
        ]}
        intensity={controls.rimIntensity}
      />
      <directionalLight
        position={[
          controls.kickerPosition.x,
          controls.kickerPosition.y,
          controls.kickerPosition.z,
        ]}
        intensity={controls.kickerIntensity}
      />
    </group>
  );
}
