"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useConfigurator } from "@/lib/store/configurator";
import { SKUS, type ColorOption, type SurfaceType } from "@/config/skus";
import { PillRow } from "./PillRow";
import { AddToCart } from "./AddToCart";

export function ProductPanel() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const colorBySku = useConfigurator((s) => s.colorBySku);
  const setColor = useConfigurator((s) => s.setColor);
  const setSurface = useConfigurator((s) => s.setSurface);

  const sku = SKUS.find((s) => s.id === activeSku)!;
  const activeColor = colorBySku[activeSku] ?? sku.defaultColor;

  return (
    <aside
      style={{
        position: "absolute",
        right: 32,
        bottom: 32,
        width: 320,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        color: "#141416",
        pointerEvents: "auto",
        zIndex: 5,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.h1
          key={sku.label}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 64,
            letterSpacing: "-0.01em",
            fontWeight: 300,
            lineHeight: 1,
          }}
        >
          {sku.label}
        </motion.h1>
      </AnimatePresence>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PillRow
          label="surface"
          options={[
            { value: "speed", label: "speed" },
            { value: "control", label: "control" },
          ]}
          active={sku.surfaceType}
          onPick={(v) => setSurface(v as SurfaceType)}
        />
        <PillRow
          label="color"
          options={[
            {
              value: "black",
              label: "black",
              disabled: !sku.colorOptions.includes("black"),
            },
            {
              value: "white",
              label: "white",
              disabled: !sku.colorOptions.includes("white"),
            },
          ]}
          active={activeColor}
          onPick={(v) => setColor(activeSku, v as ColorOption)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {sku.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              color: "#7a7a7e",
              letterSpacing: "0.02em",
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={sku.description}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: 11,
            lineHeight: 1.55,
            color: "#414145",
            margin: 0,
            maxWidth: 280,
          }}
        >
          {sku.description}
        </motion.p>
      </AnimatePresence>

      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        style={{
          fontSize: 11,
          color: "#141416",
          fontWeight: 500,
          textDecoration: "none",
          borderBottom: "1px solid #141416",
          alignSelf: "flex-start",
          paddingBottom: 1,
        }}
      >
        see full specs ↗
      </a>

      <AddToCart />
    </aside>
  );
}
