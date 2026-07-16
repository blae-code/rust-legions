import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { playSfx } from "@/lib/sfx";

// Main-menu navigation — stamped metal order plates with 2.5D depth
export default function GameMenu({ continueGame }) {
  const items = [
    continueGame && { to: `/game/${continueGame.id}`, label: "Continue War", sub: continueGame.name, hot: true },
    { to: "/new-game", label: "New Operation", sub: "Open a fresh front on the continent" },
    { to: "/faction-builder", label: "Faction Foundry", sub: "Forge a banner through the lifepath" },
    { to: "/army-designer", label: "Army Design Bureau", sub: "Draft doctrine patterns for your armies" },
    { to: "/map-editor", label: "Cartography Bureau", sub: "Draft new battlegrounds tile by tile" },
    { to: "/maps", label: "Map Archive", sub: "Survey every registered theater" },
  ].filter(Boolean);

  return (
    <nav className="mt-5 space-y-2 max-w-md" style={{ perspective: "900px" }}>
      {items.map((item, i) => (
        <motion.div
          key={item.to}
          initial={{ opacity: 0, x: -40, rotateY: -12 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.45 }}
        >
          <Link
            to={item.to}
            onMouseEnter={() => playSfx("hover")}
            onClick={() => playSfx("select")}
            className={`cq-metal group relative flex items-center gap-3 rounded-sm border pl-3 pr-4 py-2 transition-all duration-200
              hover:translate-x-1.5 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)]
              ${item.hot
                ? "border-brass/70 bg-brass/10 shadow-[0_4px_12px_rgba(0,0,0,0.55)]"
                : "border-border bg-card/70 hover:border-brass/60"}`}
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)" }}
          >
            {/* Riveted edge strip */}
            <span className={`self-stretch w-1 rounded-full shrink-0 ${item.hot ? "bg-brass cq-lamp text-brass" : "bg-border group-hover:bg-brass/70"} transition-colors`} />
            <span className={`font-mono text-[10px] tracking-widest w-6 shrink-0 ${item.hot ? "text-brass-bright" : "text-muted-foreground/70"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className={`cq-display block text-lg sm:text-xl leading-tight transition-colors ${
                item.hot ? "text-brass-bright" : "text-foreground/85 group-hover:text-brass-bright"
              }`}>
                {item.label}
              </span>
              <span className="block font-mono text-[9px] text-muted-foreground tracking-[0.18em] truncate">
                {item.sub?.toUpperCase()}
              </span>
            </span>
            <span className="ml-auto font-display text-brass/0 group-hover:text-brass/80 transition-colors text-lg shrink-0">▸</span>
          </Link>
        </motion.div>
      ))}
    </nav>
  );
}