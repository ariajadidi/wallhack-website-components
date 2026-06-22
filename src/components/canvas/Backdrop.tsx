"use client";

/**
 * White floor only — the under-pad shadow is now a per-pad fake shadow
 * mounted inside PadInstance (drei <Shadow>: a flat plane with a radial
 * gradient alpha). That's cheaper than ContactShadows and reads more
 * obviously as "the pad is sitting on something."
 */
export function Backdrop() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#f7f7f8" roughness={0.92} metalness={0} />
    </mesh>
  );
}
