import React, { useState } from "react";
import { Loader2, PenLine } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// Ministry form 7-C — the new commander signs their name
export default function CommissionPapers({ defaultName, saving, onSign }) {
  const [name, setName] = useState(defaultName);
  const valid = name.trim().length >= 2;

  const sign = (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    playSfx("build");
    onSign(name.trim());
  };

  return (
    <form onSubmit={sign} className="cq-panel cq-brackets relative overflow-hidden p-6 sm:p-8">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label text-rust pt-2">Ministry of War · Form 7-C</p>
      <h1 className="cq-display text-3xl sm:text-4xl mt-1">Commission of Field Command</h1>
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-2 leading-relaxed">
        THE BEARER IS HEREBY RAISED TO THE GENERAL STAFF, ENTRUSTED WITH ARMIES,
        AND BOUND TO THE RECOVERY OF WHAT WAS BURIED.
      </p>

      <div className="mt-6">
        <label className="cq-label block mb-2">Name of record, Commander</label>
        <div className="flex items-center gap-2 border border-input bg-background/60 rounded-sm px-3">
          <PenLine className="w-4 h-4 text-brass shrink-0" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            placeholder="Gen. A. Vance"
            className="w-full bg-transparent py-2.5 font-heading tracking-wide text-lg text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/70 tracking-widest mt-1.5">
          THIS NAME WILL APPEAR ON ALL DISPATCHES AND WAR CHRONICLES
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.25em] leading-relaxed">
          DOCUMENT CLASS: RESTRICTED<br />FALSIFICATION IS DESERTION
        </p>
        <button
          type="submit"
          disabled={!valid || saving}
          className="cq-metal bg-primary text-primary-foreground border border-brass-bright/40 font-heading uppercase tracking-[0.2em] text-sm px-6 py-2.5 rounded-sm hover:bg-brass-bright disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Sign & Seal
        </button>
      </div>
    </form>
  );
}