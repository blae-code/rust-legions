import React, { useState } from "react";
import { Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playSfx } from "@/lib/sfx";

// Strike a fresh batch of warrants — a callsign only, never an email
export default function IssueWarrantForm({ busy, onIssue }) {
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [count, setCount] = useState(1);

  const submit = (e) => {
    e.preventDefault();
    playSfx("build");
    onIssue({ label: label.trim(), note: note.trim(), count });
    setLabel("");
    setNote("");
    setCount(1);
  };

  return (
    <form onSubmit={submit} className="cq-panel relative overflow-hidden p-4 space-y-3">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label pt-1">Strike New Warrants</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-2 items-end">
        <div>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1">CALLSIGN (OPTIONAL)</p>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ironsides" />
        </div>
        <div>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1">MARGIN NOTE (OPTIONAL)</p>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="handed over at the depot" />
        </div>
        <div>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mb-1">COUNT</p>
          <Input type="number" min="1" max="25" value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="h-9 self-end">
          <Stamp className="w-4 h-4" /> Issue
        </Button>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground">
        NO PERSONAL DETAILS ARE RECORDED — A CALLSIGN IS FOR YOUR OWN BOOKKEEPING ONLY.
      </p>
    </form>
  );
}