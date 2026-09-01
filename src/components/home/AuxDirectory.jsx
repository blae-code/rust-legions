import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Layers, Map, Globe2, FileText, Image, MonitorSmartphone } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import CommandTip from "@/components/ui/CommandTip";

// Auxiliary directorates — the secondary services, compressed into a stamped chip grid.
const AUX = [
  { to: "/walkthrough", icon: GraduationCap, label: "Induction", tip: "A guided recruit drill through fortress-bases, treads and ideology." },
  { to: "/army-designer", icon: Layers, label: "Army Bureau", tip: "File doctrine patterns — formation, weapons, armor, support." },
  { to: "/map-editor", icon: Map, label: "Cartography", tip: "Draft and publish custom theater charts for new wars." },
  { to: "/star-map", icon: Globe2, label: "War Table", tip: "Orbit the theater worlds in 3D and plot day-rate marches." },
  { to: "/patch-notes", icon: FileText, label: "Amendments", tip: "The Ministry's patch dispatches — what changed and why." },
  { to: "/asset-registry", icon: Image, label: "Illustration", tip: "The master registry of commissioned art plates." },
  { to: "/install", icon: MonitorSmartphone, label: "Terminal", tip: "Install Rust Legions on your device — full-screen, from your home screen." },
];

export default function AuxDirectory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
      className="mt-3 max-w-md"
    >
      <p className="cq-label mb-1.5">Auxiliary Directorates</p>
      <div className="flex flex-wrap gap-1.5">
        {AUX.map((a) => (
          <CommandTip key={a.to} title={a.label} body={a.tip} side="top">
            <Link
              to={a.to}
              onMouseEnter={() => playSfx("hover")}
              onClick={() => playSfx("select")}
              className="cq-metal group flex items-center gap-1.5 rounded-sm border border-border bg-card/60 px-2.5 py-1.5 transition-all duration-150 hover:border-brass/60 hover:-translate-y-0.5"
            >
              <a.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brass transition-colors" />
              <span className="font-heading uppercase tracking-[0.15em] text-[10px] text-muted-foreground group-hover:text-brass-bright transition-colors">
                {a.label}
              </span>
            </Link>
          </CommandTip>
        ))}
      </div>
    </motion.div>
  );
}