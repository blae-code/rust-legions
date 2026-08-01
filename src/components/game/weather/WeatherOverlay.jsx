import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Full-screen atmospheric layer for the war room. Each weather state fades in
// and out over several seconds, so the front visibly thickens and clears as the
// days turn rather than snapping between conditions.
const LAYERS = {
  clear: [{ key: "dust-light", className: "cq-dust", opacity: 0.35 }],
  rain: [
    { key: "dust-haze", className: "cq-dust", opacity: 0.15 },
    { key: "rain", className: "cq-rain", opacity: 0.7 },
  ],
  storm: [
    { key: "dust-heavy", className: "cq-dust cq-dust-heavy", opacity: 0.85 },
    { key: "rain-heavy", className: "cq-rain", opacity: 1 },
    { key: "flash", className: "cq-stormflash bg-slate-200", opacity: 1 },
  ],
  fog: [
    { key: "dust-haze", className: "cq-dust", opacity: 0.3 },
    { key: "fog", className: "cq-fogbank", opacity: 0.9 },
  ],
  snow: [{ key: "snow", className: "cq-snowfall", opacity: 0.75 }],
};

export default function WeatherOverlay({ weather = "clear" }) {
  const layers = LAYERS[weather] || LAYERS.clear;

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {layers.map((l) => (
          <motion.div
            key={`${weather}-${l.key}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: l.opacity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className={`absolute inset-0 ${l.className}`}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}