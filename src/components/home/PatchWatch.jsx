import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Radio } from "lucide-react";
import AmendmentTally from "@/components/home/AmendmentTally";
import { isPostRelease, compareVersions, tallyChanges, serviceTotals, lastReviewedVersion, markReviewed } from "@/lib/patchWatch";

// Patch Watch — the Ministry's standing wire on every official advance past 1.0.
export default function PatchWatch() {
  const [patches, setPatches] = useState(null);
  const [seen, setSeen] = useState(lastReviewedVersion());

  useEffect(() => {
    base44.entities.Patch.filter({ isPublished: true })
      .then((all) => setPatches(all.filter((p) => isPostRelease(p.version)).sort((a, b) => compareVersions(b.version, a.version))))
      .catch(() => setPatches([]));
  }, []);

  if (patches === null) return null;

  if (patches.length === 0) {
    return (
      <div className="cq-panel p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Radio className="w-3 h-3 text-muted-foreground" />
          <p className="cq-label">Patch Watch</p>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] leading-relaxed">
          THE WAR HAS NOT YET BEEN DECLARED OPEN — NO POST-1.0 AMENDMENTS ON THE WIRE.
        </p>
      </div>
    );
  }

  const latest = patches[0];
  const { counts, total } = tallyChanges(latest.changes);
  const totals = serviceTotals(patches);
  const isNew = compareVersions(latest.version, seen) > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="cq-panel cq-brackets p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Radio className={`w-3 h-3 ${isNew ? "text-rust" : "text-muted-foreground"}`} />
        <p className="cq-label">Patch Watch</p>
        {isNew && (
          <span className="cq-tag border-rust/60 text-rust ml-auto">
            <span className="w-1 h-1 rounded-full bg-rust cq-lamp text-rust mr-1" /> New Wire
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl text-brass-bright leading-none">v{latest.version}</span>
        {latest.codename && (
          <span className="font-heading uppercase tracking-[0.2em] text-[10px] text-brass/80 truncate">“{latest.codename}”</span>
        )}
      </div>
      <p className="font-heading text-xs text-foreground/85 tracking-wide mt-0.5 line-clamp-2">{latest.title}</p>
      {latest.releaseDate && (
        <p className="font-mono text-[8px] text-muted-foreground tracking-[0.25em] mt-0.5">
          ISSUED {latest.releaseDate}
        </p>
      )}

      <div className="cq-hazard my-2 opacity-60" />
      <AmendmentTally counts={counts} total={total} />

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="border border-border rounded-sm bg-background/50 px-2 py-1">
          <p className="font-mono text-[7px] text-muted-foreground tracking-[0.2em]">RELEASES</p>
          <p className="font-display text-lg text-brass-bright leading-none">{totals.releases}</p>
        </div>
        <div className="border border-border rounded-sm bg-background/50 px-2 py-1">
          <p className="font-mono text-[7px] text-muted-foreground tracking-[0.2em]">TOTAL FILED</p>
          <p className="font-display text-lg text-brass-bright leading-none">{totals.total}</p>
        </div>
      </div>

      <Link
        to="/patch-notes"
        onClick={() => { markReviewed(latest.version); setSeen(latest.version); }}
        className="mt-2 block text-center font-heading uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:text-brass-bright border border-border hover:border-brass/60 rounded-sm py-1 transition-colors cq-metal"
      >
        Read The Dispatch
      </Link>
    </motion.div>
  );
}