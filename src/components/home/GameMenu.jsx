import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { playSfx } from "@/lib/sfx";

// Main-menu navigation — big game-style entries with hover/select audio
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
    <nav className="mt-8 space-y-1">
      {items.map((item, i) => (
        <motion.div
          key={item.to}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
        >
          <Link
            to={item.to}
            onMouseEnter={() => playSfx("hover")}
            onClick={() => playSfx("select")}
            className={`group flex items-baseline gap-3 border-l-2 pl-4 py-2 transition-all hover:pl-6 ${
              item.hot ? "border-brass" : "border-transparent hover:border-brass"
            }`}
          >
            <span className={`cq-display text-2xl sm:text-3xl transition-colors ${
              item.hot ? "text-brass-bright" : "text-foreground/80 group-hover:text-brass-bright"
            }`}>
              {item.label}
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground tracking-widest opacity-0 group-hover:opacity-100 transition-opacity truncate">
              {item.sub?.toUpperCase()}
            </span>
          </Link>
        </motion.div>
      ))}
    </nav>
  );
}