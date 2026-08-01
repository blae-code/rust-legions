import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { WEATHER_META } from "@/lib/weather";
import { playSfx } from "@/lib/sfx";

// Meteorological Section wires the front when the sky turns over the theater.
export default function WeatherAlert({ weather, planetName }) {
  const prev = useRef(undefined);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!weather) return;
    const was = prev.current;
    prev.current = weather;
    if (was === undefined || was === weather) return;
    playSfx("select");
    setAlert({ key: Date.now(), from: was, to: weather });
    const t = setTimeout(() => setAlert(null), 11000);
    return () => clearTimeout(t);
  }, [weather]);

  const meta = alert ? WEATHER_META[alert.to] || WEATHER_META.clear : null;
  const fromMeta = alert ? WEATHER_META[alert.from] || WEATHER_META.clear : null;

  return (
    <AnimatePresence>
      {alert && (
        <motion.div
          key={alert.key}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          className="fixed bottom-4 right-4 z-[75] w-72 cq-panel cq-brackets overflow-hidden p-3 bg-card/95"
        >
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <button
            onClick={() => setAlert(null)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-brass-bright"
          >
            <X className="w-3 h-3" />
          </button>
          <p className="cq-label pt-1">Meteorological Section</p>
          <p className="font-heading uppercase tracking-[0.16em] text-sm text-brass-bright mt-0.5">
            <span className="mr-1">{meta.icon}</span>{meta.label}
          </p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-0.5">
            {(planetName || "THE FRONT").toUpperCase()} · {fromMeta.label.toUpperCase()} ▸ {meta.label.toUpperCase()}
          </p>
          <ul className="mt-2 space-y-0.5">
            {meta.effects.length === 0 ? (
              <li className="font-mono text-[10px] text-olive tracking-wider">▸ NO PENALTY — THE FRONT MOVES FREELY</li>
            ) : (
              meta.effects.map((e) => (
                <li key={e} className="font-mono text-[10px] text-secondary-foreground tracking-wider">▸ {e.toUpperCase()}</li>
              ))
            )}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}