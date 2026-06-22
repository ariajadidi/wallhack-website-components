"use client";

import { Html } from "@react-three/drei";

/** Floating tag pinned above a non-active pad, matching the design reference. */
export function PadLabel({
  label,
  sub,
  visible,
}: {
  label: string;
  sub?: string;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <Html
      position={[0, 0.06, 0]}
      center
      zIndexRange={[10, 0]}
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      <div
        style={{
          background: "#f5f5f5",
          color: "#141416",
          padding: "5px 10px",
          borderRadius: 2,
          fontFamily: "var(--font-display)",
          fontSize: 10,
          letterSpacing: "0.06em",
          fontWeight: 300,
          whiteSpace: "nowrap",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          opacity: 0.94,
        }}
      >
        <div style={{ textTransform: "uppercase" }}>{label}</div>
        {sub && (
          <div style={{ color: "#7a7a7e", fontSize: 8, marginTop: 1 }}>{sub}</div>
        )}
      </div>
    </Html>
  );
}
