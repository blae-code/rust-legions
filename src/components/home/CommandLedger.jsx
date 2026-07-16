import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, BellRing, Flag, Trophy } from "lucide-react";

function CountUp({ value }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value === 0) { setN(0); return; }
    let frame = 0;
    const total = 30;
    const id = setInterval(() => {
      frame++;
      setN(Math.round((frame / total) * value));
      if (frame >= total) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [value]);
  return <>{n}</>;
}

export default function CommandLedger({ games, factions }) {
  const g = games || [];
  const stats = [
    { icon: Swords, label: "Active Fronts", value: g.filter((x) => x.status === "active").length, accent: "text-brass-bright" },
    { icon: BellRing, label: "Awaiting Orders", value: g.filter((x) => x.isMyTurn).length, accent: "text-rust", pulse: true },
    { icon: Flag, label: "Factions Forged", value: (factions || []).length, accent: "text-olive" },
    { icon: Trophy, label: "Wars Concluded", value: g.filter((x) => x.status === "complete").length, accent: "text-steel" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 -mt-6 relative z-10 px-1">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="cq-panel p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 + i * 0.1, duration: 0.5 }}
        >
          <div className={`w-9 h-9 rounded-sm border border-border bg-secondary/60 flex items-center justify-center ${s.accent} ${s.pulse && s.value > 0 ? "animate-pulse" : ""}`}>
            <s.icon className="w-4 h-4" />
          </div>
          <div>
            <p className={`font-display text-2xl leading-none ${s.accent}`}><CountUp value={s.value} /></p>
            <p className="cq-label mt-0.5">{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}