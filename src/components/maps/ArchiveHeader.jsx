import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// Stamped archive masthead — Cartography Bureau, Form 4-C.
export default function ArchiveHeader({ chartCount, settlementCount }) {
  const now = new Date();
  const serial = `C-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="cq-label text-rust">Cartography Bureau · Survey Register {serial}</p>
          <div className="relative inline-block">
            <h1 className="cq-display text-4xl sm:text-5xl leading-[0.9]">The Chart Archive</h1>
            <motion.span
              className="cq-stamp absolute -right-20 top-1 text-[10px] whitespace-nowrap hidden sm:block"
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ delay: 0.5, duration: 0.25, ease: "easeOut" }}
            >
              Surveyed
            </motion.span>
          </div>
          <p className="text-sm text-muted-foreground font-heading tracking-wide mt-1 max-w-xl">
            Every theater ever surveyed by a commander's hand — drawn, published, and assessed in the field.
          </p>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right hidden md:block">
            <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] leading-relaxed">
              FORM 4-C · REGISTER OF SURVEYED THEATERS<br />
              {chartCount} CHART{chartCount === 1 ? "" : "S"} ON FILE · {settlementCount} SETTLEMENTS PLOTTED
            </p>
          </div>
          <Link to="/map-editor" onClick={() => playSfx("select")}>
            <Button variant="outline" className="text-xs"><Compass className="w-3.5 h-3.5" /> Draft a Chart</Button>
          </Link>
        </div>
      </div>
      <div className="cq-hazard mt-3" />
    </motion.div>
  );
}