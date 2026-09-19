import React from "react";
import MedalBadge from "@/components/medals/MedalBadge";
import { MEDALS } from "@/lib/medals";

export default function MedalBadges({ medals = [], compact = false, label = "Combat decorations" }) {
  const earned = Object.keys(MEDALS).filter((key) => medals.includes(key));
  return (
    <div>
      <p className="cq-label mb-2">{label} · {earned.length}/{Object.keys(MEDALS).length}</p>
      {earned.length ? (
        <div className="flex flex-wrap gap-2">
          {earned.map((key) => <MedalBadge key={key} medalId={key} compact={compact} />)}
        </div>
      ) : (
        <p className="font-mono text-[10px] text-muted-foreground">No combat decorations recorded.</p>
      )}
    </div>
  );
}