import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, PenLine } from "lucide-react";
import PatchDispatch from "@/components/patch/PatchDispatch";
import PatchComposer from "@/components/patch/PatchComposer";
import { getImage } from "@/lib/imageLibrary";

// Version sort — newest amendment first (semver-aware)
const verParts = (v = "") => v.split(".").map((n) => parseInt(n, 10) || 0);
const cmpVer = (a, b) => {
  const [x, y] = [verParts(a.version), verParts(b.version)];
  for (let i = 0; i < 3; i++) if ((y[i] || 0) !== (x[i] || 0)) return (y[i] || 0) - (x[i] || 0);
  return 0;
};

export default function PatchNotes() {
  const [patches, setPatches] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    const [all, user] = await Promise.all([
      base44.entities.Patch.list("-releaseDate", 100),
      base44.auth.me().catch(() => null),
    ]);
    const admin = user?.role === "admin";
    setIsAdmin(admin);
    setPatches((admin ? all : all.filter((p) => p.isPublished)).sort(cmpVer));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!patches) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  const latestVersion = patches.find((p) => p.isPublished)?.version;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <header className="cq-panel relative overflow-hidden px-5 pt-6 pb-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        {getImage("ui_patch_category_stamps") && (
          <img
            src={getImage("ui_patch_category_stamps")}
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-auto max-w-[42%] object-cover object-right opacity-[0.13] pointer-events-none select-none hidden sm:block"
          />
        )}
        <div className="relative z-10">
        <p className="cq-label text-rust">War Ministry · Office of Continuous Mobilization</p>
        <h1 className="cq-display text-3xl mt-1">Field Amendments</h1>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2 max-w-xl">
          What you fight on today is the <span className="text-brass-bright font-semibold">vanilla front</span> — the base
          articles of war. The Ministry issues amendments continuously: new materiel, revised doctrine, rebalanced
          arithmetic, and field repairs. Every dispatch below records exactly what changed and how it lands on the front.
        </p>
        <div className="flex items-center gap-3 mt-3">
          {latestVersion && (
            <span className="font-mono text-[10px] text-brass tracking-[0.25em]">CURRENT ARTICLES · v{latestVersion}</span>
          )}
          {isAdmin && (
            <Button size="sm" variant="outline" className="ml-auto" onClick={() => setComposing(true)}>
              <PenLine className="w-3.5 h-3.5" /> Draft Dispatch
            </Button>
          )}
        </div>
        </div>
      </header>

      {patches.length === 0 && (
        <p className="text-center text-sm text-muted-foreground font-heading tracking-widest uppercase py-10">
          No dispatches on file — the presses are warming up.
        </p>
      )}

      <div className="space-y-3">
        {patches.map((p, i) => (
          <div key={p.id} className="relative">
            <PatchDispatch patch={p} latest={p.version === latestVersion && p.isPublished} defaultOpen={i === 0} />
            {isAdmin && (
              <button
                onClick={() => setEditing(p)}
                className="absolute top-3 right-12 font-mono text-[9px] text-muted-foreground hover:text-brass tracking-widest"
              >
                REVISE
              </button>
            )}
          </div>
        ))}
      </div>

      {(composing || editing) && (
        <PatchComposer
          open
          patch={editing}
          onClose={() => { setComposing(false); setEditing(null); }}
          onSaved={() => { setComposing(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}