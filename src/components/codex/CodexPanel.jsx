import React, { useState } from "react";
import { X, BookOpen } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import FactionArchive from "./FactionArchive";
import WorldArchive from "./WorldArchive";
import CampaignAnnals from "./CampaignAnnals";

const TABS = [
  { id: "factions", label: "Factions" },
  { id: "worlds", label: "Worlds" },
  { id: "annals", label: "Annals" },
];

// The Archive — readable mid-campaign without leaving the war room.
export default function CodexPanel({ open, onClose, activePlanetId }) {
  const [tab, setTab] = useState("factions");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[66] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="cq-panel relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-brass-bright">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mt-1 mb-1">
          <BookOpen className="w-4 h-4 text-brass" />
          <h2 className="cq-display text-2xl leading-none">The Archive</h2>
        </div>
        <p className="cq-label mb-4">Faction dossiers · planetary history · campaign annals</p>

        <div className="flex gap-1.5 mb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => { playSfx("select"); setTab(t.id); }}
              className={`px-3 py-1.5 rounded-sm border font-heading uppercase tracking-[0.18em] text-xs transition-colors ${
                tab === t.id ? "border-brass bg-brass/15 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "factions" && <FactionArchive />}
        {tab === "worlds" && <WorldArchive activePlanetId={activePlanetId} />}
        {tab === "annals" && <CampaignAnnals />}
      </div>
    </div>
  );
}