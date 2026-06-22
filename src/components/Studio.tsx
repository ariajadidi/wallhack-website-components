"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, AgXToneMapping, SRGBColorSpace } from "three";
import { StudioRig } from "./canvas/StudioRig";
import { Backdrop } from "./canvas/Backdrop";
import { Showroom } from "./canvas/Showroom";
import { PostFX } from "./canvas/PostFX";
import { CameraDolly } from "./canvas/CameraDolly";
import { CAM_DEPTH, CAM_HEIGHT } from "@/config/layout";
import { useLightingControls } from "@/lib/store/lighting";

const BG_HEX = "#ebebed";

/** Pushes the live tone-mapping exposure from leva into the renderer. */
function ToneMapping({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

export default function Studio() {
  const controls = useLightingControls();

  return (
    <div style={{ position: "absolute", inset: 0, background: BG_HEX }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        // FOV 14 → near-orthographic telephoto compression. Camera distance
        // (sqrt(h²+d²) ≈ 2.34m) is tuned to maintain the same on-screen pad
        // size as the previous 45°/FOV 30 framing.
        camera={{ position: [0, CAM_HEIGHT, CAM_DEPTH], fov: 14, near: 0.05, far: 60 }}
        gl={{ antialias: true }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = SRGBColorSpace;
          gl.toneMapping = AgXToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.setClearColor(new Color(BG_HEX), 1);
          scene.background = new Color(BG_HEX);

          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("[WebGL] context lost");
          });
          canvas.addEventListener("webglcontextrestored", () => {
            console.info("[WebGL] context restored");
          });
        }}
      >
        <ToneMapping exposure={controls.toneMappingExposure} />
        <StudioRig controls={controls} />
        <Backdrop />
        <Showroom />
        <CameraDolly />
        <PostFX />
      </Canvas>
    </div>
  );
}
