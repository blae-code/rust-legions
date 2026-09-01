import React, { useState } from "react";
import { Copy, Check, Ban, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playSfx } from "@/lib/sfx";

const STATUS_STYLE = {
  open: "border-brass/50 text-brass-bright",
  redeemed: "border-olive/60 text-olive",
  revoked: "border-rust/60 text-rust",
};

const STATUS_LABEL = { open: "Unclaimed", redeemed: "In Service", revoked: "Rescinded" };

// One warrant on the register — copy, rescind, reinstate, or strike from the record
export default function WarrantRow({ warrant, busy, onAction }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(warrant.code);
    playSfx("select");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border border-border bg-secondary/30 rounded-sm p-2">
      <button onClick={copy} className="cq-metal font-mono text-xs text-foreground tracking-[0.14em] border border-brass/40 rounded-sm px-2 py-1 flex items-center gap-1.5">
        {warrant.code}
        {copied ? <Check className="w-3 h-3 text-olive" /> : <Copy className="w-3 h-3 text-brass/70" />}
      </button>

      <span className={`cq-tag ${STATUS_STYLE[warrant.status] || "border-border text-muted-foreground"}`}>
        {STATUS_LABEL[warrant.status] || warrant.status}
      </span>

      {warrant.label && (
        <span className="font-heading uppercase tracking-wide text-xs text-secondary-foreground">{warrant.label}</span>
      )}
      {warrant.note && <span className="font-mono text-[9px] text-muted-foreground">{warrant.note}</span>}

      <div className="ml-auto flex gap-1.5">
        {warrant.status !== "revoked" ? (
          <Button size="sm" variant="outline" disabled={busy} className="h-6 px-2 text-[10px] border-rust/50 text-rust" onClick={() => onAction("revoke", warrant.id)}>
            <Ban className="w-3 h-3" /> Rescind
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} className="h-6 px-2 text-[10px] border-brass/50 text-brass-bright" onClick={() => onAction("restore", warrant.id)}>
            <RotateCcw className="w-3 h-3" /> Reinstate
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={busy} className="h-6 px-2 text-[10px] border-border text-muted-foreground" onClick={() => onAction("remove", warrant.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}