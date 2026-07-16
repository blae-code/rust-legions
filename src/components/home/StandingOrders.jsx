import React from "react";
import { Crosshair, Fuel, Castle, Flag } from "lucide-react";

const ORDERS = [
  { icon: Crosshair, text: "Hold 60% of the continent or seize every capital", tone: "text-brass-bright" },
  { icon: Fuel, text: "Guard your supply lines — cut-off zones cannot build or rearm", tone: "text-rust" },
  { icon: Castle, text: "Capitals, barracks & forts project supply four zones out", tone: "text-olive" },
  { icon: Flag, text: "Field armies under generals decide the great battles", tone: "text-steel" },
];

// High Command standing orders — the rules of engagement at a glance
export default function StandingOrders() {
  return (
    <div className="cq-panel cq-brackets p-3.5">
      <p className="cq-label mb-2.5">Standing Orders</p>
      <div className="space-y-2">
        {ORDERS.map(({ icon: Icon, text, tone }, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${tone}`} />
            <p className="font-mono text-[10px] text-secondary-foreground/85 tracking-wide leading-snug">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}