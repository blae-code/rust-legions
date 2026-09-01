import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// Received wire traffic, plus the pad for wiring a reply.
export default function DispatchInbox({ dispatches, target, myCallsign, onClearTarget, onRefresh }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!text.trim() || !target) return;
    setBusy(true);
    playSfx("build");
    await base44.entities.Dispatch.create({
      toUserId: target.created_by_id,
      toCallsign: target.displayName,
      fromCallsign: myCallsign || "UNSIGNED",
      text: text.trim(),
    });
    setText("");
    setBusy(false);
    onClearTarget();
    onRefresh();
  };

  const markRead = async (d) => {
    if (d.readAt) return;
    await base44.entities.Dispatch.update(d.id, { readAt: new Date().toISOString() });
    onRefresh();
  };

  return (
    <div className="space-y-2">
      {target && (
        <div className="cq-panel p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="cq-label text-brass">Wire to {target.displayName}</p>
            <button onClick={onClearTarget} className="text-muted-foreground hover:text-rust"><X className="w-3.5 h-3.5" /></button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Message text…"
            className="w-full bg-input border border-border rounded-sm p-2 text-xs text-secondary-foreground font-mono"
          />
          <Button size="sm" disabled={busy || !text.trim()} onClick={send} className="w-full text-xs">
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Transmit"}
          </Button>
        </div>
      )}

      {dispatches.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-3 text-center">NO TRAFFIC ON THE WIRE</p>
      ) : (
        dispatches.map((d) => (
          <button
            key={d.id}
            onClick={() => markRead(d)}
            className={`w-full text-left px-2.5 py-1.5 rounded-sm border transition-colors ${
              d.readAt ? "border-border bg-secondary/20" : "border-brass/60 bg-brass/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-heading uppercase tracking-widest text-[11px] text-brass truncate">{d.fromCallsign}</span>
              {!d.readAt && <span className="font-mono text-[8px] text-rust tracking-widest ml-auto">UNREAD</span>}
            </div>
            <p className="font-mono text-[10px] text-secondary-foreground whitespace-pre-wrap break-words">{d.text}</p>
          </button>
        ))
      )}
    </div>
  );
}