import React, { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { ChevronDown } from "lucide-react";
import ChangeEntry from "@/components/patch/ChangeEntry";
import { CHANGE_CATEGORIES, CATEGORY_KEYS } from "@/components/patch/patchMeta";

// One patch rendered as a War Ministry communiqué — expandable, grouped by category
export default function PatchDispatch({ patch, latest, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const grouped = CATEGORY_KEYS.map((k) => ({
    key: k,
    meta: CHANGE_CATEGORIES[k],
    items: (patch.changes || []).filter((c) => c.category === k),
  })).filter((g) => g.items.length > 0);

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="cq-panel cq-brackets relative overflow-hidden">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 pt-5 pb-4 group">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="cq-label text-rust">
              General Staff Communiqué · {patch.releaseDate || "UNDATED"}
              {!patch.isPublished && <span className="ml-2 text-brass">· DRAFT — UNPUBLISHED</span>}
            </p>
            <h2 className="cq-display text-2xl mt-1">
              Amendment {patch.version}
              {patch.codename && <span className="text-brass-bright"> — "{patch.codename}"</span>}
            </h2>
            <p className="font-heading text-sm text-secondary-foreground tracking-wide mt-0.5">{patch.title}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-1">
            {latest && <span className="cq-stamp text-xs">Current</span>}
            <ChevronDown className={`w-4 h-4 text-brass transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
        {!open && (
          <p className="font-mono text-[10px] text-muted-foreground mt-2 tracking-wide">
            {(patch.changes || []).length} AMENDMENT{(patch.changes || []).length === 1 ? "" : "S"} FILED — TAP TO UNSEAL
          </p>
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {patch.summary && (
            <div className="border border-border rounded-sm bg-background/50 p-3 text-xs text-muted-foreground leading-relaxed prose prose-invert prose-xs max-w-none [&_p]:my-1">
              <ReactMarkdown>{patch.summary}</ReactMarkdown>
            </div>
          )}
          {grouped.map((g) => (
            <section key={g.key}>
              <p className={`cq-label ${g.meta.color} mb-2`}>{g.meta.label} — {g.meta.desc}</p>
              <div className="space-y-2">
                {g.items.map((c, i) => <ChangeEntry key={i} change={c} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.article>
  );
}