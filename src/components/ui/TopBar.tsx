"use client";

import { motion } from "framer-motion";
import { useConfigurator } from "@/lib/store/configurator";
import { SKUS } from "@/config/skus";

export function TopBar() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const active = SKUS.find((s) => s.id === activeSku)!;

  const navItems = [
    { label: "GLASS PAD", sub: active.label.toLowerCase() },
    { label: "SKATES", sub: "empty" },
    { label: "SLEEVES", sub: "empty" },
  ];

  return (
    <header
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        padding: "22px 32px",
        display: "flex",
        alignItems: "flex-start",
        gap: 36,
        pointerEvents: "none",
        fontSize: 11,
        letterSpacing: "0.06em",
        zIndex: 5,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          letterSpacing: "0.08em",
          fontSize: 16,
        }}
      >
        WALLHACK
      </motion.div>

      <nav style={{ display: "flex", gap: 24, marginLeft: 16 }}>
        {navItems.map((n) => (
          <Chip key={n.label} label={n.label} sub={n.sub} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      <Chip label="EXIT" sub="back to site" />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: "#141416",
          fontWeight: 500,
          paddingTop: 4,
          pointerEvents: "auto",
        }}
      >
        <span style={{ fontSize: 14 }}>♡</span>
        <span style={{ fontSize: 14 }}>⌂</span>
        <span style={{ fontSize: 11, opacity: 0.85 }}>EUR (€)</span>
      </div>
    </header>
  );
}

function Chip({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ pointerEvents: "auto" }}>
      <div
        style={{
          padding: "5px 10px",
          background: "#f5f5f5",
          color: "#141416",
          borderRadius: 2,
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </div>
      <motion.div
        key={sub}
        initial={{ opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          marginTop: 4,
          color: "#7a7a7e",
          fontWeight: 400,
          paddingLeft: 2,
        }}
      >
        {sub}
      </motion.div>
    </div>
  );
}
