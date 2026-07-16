import React from "react";
import { DOCTRINES, PHILOSOPHIES, VALUES } from "@/lib/lifepath";
import ChoiceGroup from "@/components/walkthrough/ChoiceGroup";

const DOCTRINE_IMPACT = {
  aggressive: "Aggressive NPC factions will respect strength and probe your borders — and your Marshal gains a strategist's edge.",
  economic: "Economic NPC factions favor trade with you — your Marshal leans on leadership, and wars are won in the foundry.",
  defensive: "Defensive powers see a kindred bulwark — your Marshal splits strategy and leadership, and your walls hold harder.",
};

// The political ideology basics — doctrine, philosophy, and values, and what they change in play
export default function IdeologyDrill({ ideology, onChange }) {
  const done = ideology.doctrine && ideology.philosophy && ideology.value;
  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-foreground font-body leading-relaxed">
        Every faction is built in the <span className="text-brass-bright">Faction Foundry</span> through a lifepath — its history, doctrine,
        philosophy and values. These are not flavor: they shape your traits, how NPC factions
        feel about you from turn one, and how your war is fought. Draft a creed below.
      </p>
      <ChoiceGroup label="War Doctrine — how you fight" options={DOCTRINES} value={ideology.doctrine} onPick={(id) => onChange({ ...ideology, doctrine: id })} />
      <ChoiceGroup label="Political Philosophy — how the state is run" options={PHILOSOPHIES} value={ideology.philosophy} onPick={(id) => onChange({ ...ideology, philosophy: id })} />
      <ChoiceGroup label="National Values — what your people hold sacred" options={VALUES} value={ideology.value} onPick={(id) => onChange({ ...ideology, value: id })} />
      {done && (
        <div className="border border-brass/40 bg-secondary/40 rounded-sm px-4 py-3">
          <p className="cq-label mb-1">State Creed — Drafted</p>
          <p className="text-xs text-secondary-foreground font-body">
            A nation of <span className="text-brass-bright">{PHILOSOPHIES.find((p) => p.id === ideology.philosophy)?.label}</span>,
            holding to <span className="text-brass-bright">{VALUES.find((v) => v.id === ideology.value)?.label}</span>,
            marching under the <span className="text-brass-bright">{DOCTRINES.find((d) => d.id === ideology.doctrine)?.label}</span>.
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">{DOCTRINE_IMPACT[ideology.doctrine]}</p>
        </div>
      )}
    </div>
  );
}