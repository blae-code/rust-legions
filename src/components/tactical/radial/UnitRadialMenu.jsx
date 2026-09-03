import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import RadialNode from "./RadialNode";

// The expanding order tree, fanned around the counter it belongs to. Each level
// replaces the ring; the hub walks back up, or dismisses at the root.
// Number keys 1–9 pick, Backspace goes up a level, Esc closes.
export default function UnitRadialMenu({ stand, ring, trail, note, onPick, onBack, onClose }) {
  const R = 58;
  const n = Math.max(ring.length, 1);
  const atRoot = trail.length === 0;

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "Escape") { playSfx("select"); onClose(); return; }
      if (e.key === "Backspace") { e.preventDefault(); playSfx("select"); atRoot ? onClose() : onBack(); return; }
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < ring.length && !ring[idx].disabled) {
        e.preventDefault();
        playSfx("select");
        onPick(ring[idx]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ring, atRoot, onPick, onBack, onClose]);

  return (
    <motion.div
      className="relative"
      style={{ width: 0, height: 0 }}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.14 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="absolute rounded-full border border-brass/25 pointer-events-none"
        style={{ width: R * 2 + 34, height: R * 2 + 34, left: -(R + 17), top: -(R + 17) }}
      />

      {/* hub — up a level, or dismiss at the root */}
      <button
        onClick={(e) => { e.stopPropagation(); playSfx("select"); atRoot ? onClose() : onBack(); }}
        onMouseEnter={() => playSfx("hover")}
        title={atRoot ? "Dismiss" : "Back"}
        className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full cq-metal bg-secondary border border-rust/60 text-rust flex items-center justify-center hover:text-brass-bright transition-colors"
      >
        {atRoot ? <X className="w-3 h-3" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {ring.map((node, i) => {
        const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
        return (
          <RadialNode
            key={node.key}
            node={node}
            index={i}
            x={Math.cos(a) * R}
            y={Math.sin(a) * R}
            onPick={onPick}
          />
        );
      })}

      {/* name plate + breadcrumb of the branch currently open */}
      <div
        className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] px-1.5 py-0.5 bg-black/85 border border-brass/50 text-brass-bright rounded-sm pointer-events-none"
        style={{ left: 0, top: R + 30 }}
      >
        {stand.name.toUpperCase()}
        {trail.length > 0 && <span className="text-muted-foreground"> · {trail.join(" › ").toUpperCase()}</span>}
        {note && <span className="text-rust"> · {note.toUpperCase()}</span>}
      </div>
    </motion.div>
  );
}