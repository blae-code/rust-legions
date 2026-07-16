import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

// Radial orders menu — rendered centered on a settlement node. Options are
// pre-filtered by the caller so only eligible orders ever appear.
export default function NodeRadialMenu({ node, kindLabel, options = [], onClose }) {
  const R = 62;
  const n = Math.max(options.length, 1);
  return (
    <div className="relative" style={{ width: 0, height: 0 }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.16 }}>
        {/* Targeting ring */}
        <div
          className="absolute rounded-full border border-brass/30 pointer-events-none"
          style={{ width: R * 2 + 38, height: R * 2 + 38, left: -(R + 19), top: -(R + 19) }}
        />
        {/* Center hub — dismiss */}
        <button
          onClick={onClose}
          title="Dismiss"
          className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full cq-metal bg-secondary border border-rust/60 text-rust flex items-center justify-center hover:text-brass-bright transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
        {/* Eligible orders, fanned around the node */}
        {options.map((o, i) => {
          const a = ((-90 + (360 / n) * i) * Math.PI) / 180;
          const x = Math.cos(a) * R;
          const y = Math.sin(a) * R;
          const Icon = o.icon;
          return (
            <button
              key={o.key}
              onClick={o.act}
              className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2"
              style={{ left: x, top: y }}
            >
              <span
                className={`w-9 h-9 rounded-full cq-metal bg-secondary border flex items-center justify-center transition-transform hover:scale-110 ${
                  o.tone === "rust" ? "border-rust/60 text-rust" : "border-brass/60 text-brass-bright"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="font-mono text-[8px] tracking-widest bg-black/85 border border-border px-1 py-px rounded-sm whitespace-nowrap text-brass-bright">
                {o.label.toUpperCase()}
              </span>
            </button>
          );
        })}
        {/* Name plate */}
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] px-1.5 py-0.5 bg-black/85 border border-brass/50 text-brass-bright rounded-sm pointer-events-none"
          style={{ left: 0, top: R + 34 }}
        >
          {node.name.toUpperCase()}
          <span className="text-muted-foreground"> · {kindLabel.toUpperCase()}</span>
        </div>
      </motion.div>
    </div>
  );
}