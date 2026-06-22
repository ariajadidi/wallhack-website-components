"use client";

import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Pre-scene loader. Shows a centered WALLHACK wordmark with a thin progress
 * bar tied to actual GLB byte progress via drei's useProgress hook.
 * Crossfades out once everything has been loaded, with a small minimum
 * dwell so the transition doesn't read as a flash on fast networks.
 */
const MIN_DWELL_MS = 700;

export function Loader() {
  const { progress, active, total } = useProgress();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (total > 0 && !active && progress >= 100) {
      const t = setTimeout(() => setDone(true), MIN_DWELL_MS);
      return () => clearTimeout(t);
    }
  }, [progress, active, total]);

  // If nothing ever loaded (e.g. cached), still bail after a generous timeout.
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            background: "#ebebed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              letterSpacing: "0.18em",
              fontSize: 20,
              color: "#141416",
              marginBottom: 24,
            }}
          >
            WALLHACK
          </motion.div>

          <div
            style={{
              width: 140,
              height: 1,
              background: "#d8d8da",
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ height: "100%", background: "#141416" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
