import React from "react";
import { motion } from "framer-motion";
import { Flag, Swords, Factory, Crown } from "lucide-react";

const STEPS = [
  { icon: Flag, num: "01", title: "Forge a Faction", text: "Walk the lifepath. Choose a doctrine, balance assets against liabilities, and let the Ministry pen your nation's history." },
  { icon: Swords, num: "02", title: "Open a Front", text: "Select a theater from the archive or draft your own. Summon rival commanders — or face doctrine-driven NPC regimes." },
  { icon: Factory, num: "03", title: "Fuel the War Machine", text: "Seize manpower, steel, and fuel zones. Raise barracks, foundries, and refineries to outproduce the enemy." },
  { icon: Crown, num: "04", title: "Break Their Capitals", text: "Hold 60% of the land or storm the enemy seat of power. Only one banner flies when the smoke clears." },
];

export default function DoctrineBriefing() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.num}
          className="cq-panel cq-brackets relative p-5 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <span className="absolute -top-3 -right-1 font-display text-7xl text-brass/10 select-none">{s.num}</span>
          <div className="w-9 h-9 rounded-sm border border-brass/40 bg-brass/10 flex items-center justify-center text-brass-bright mb-3">
            <s.icon className="w-4 h-4" />
          </div>
          <h3 className="font-heading font-semibold uppercase tracking-wide text-foreground mb-1.5">{s.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
        </motion.div>
      ))}
    </div>
  );
}