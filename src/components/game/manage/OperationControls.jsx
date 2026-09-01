import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, Pause, Play, Ban, Loader2 } from "lucide-react";
import CommandTip from "@/components/ui/CommandTip";
import { playSfx } from "@/lib/sfx";

// Host / Ministry controls for a front — rename, amend directives, suspend, strike.
export default function OperationControls({ game, onChanged, floating = false }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(game.name || "");
  const [winType, setWinType] = useState(game.campaignWinCondition?.type || "territory");
  const [winValue, setWinValue] = useState(game.campaignWinCondition?.value || 60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const canManage = game.isHost || user?.role === "admin";
  if (!canManage || game.status === "complete" || game.status === "cancelled") return null;

  const call = async (payload) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("gameAdmin", { gameId: game.id, ...payload });
      playSfx("select");
      await onChanged();
    } catch (e) {
      setError(e.response?.data?.error || "The order was refused");
    }
    setBusy(false);
    setConfirmCancel(false);
  };

  return (
    <>
      <CommandTip title="Operation Command" body="Host controls — rename the front, amend directives, suspend or strike it." side="bottom">
        <button
          onClick={() => { playSfx("select"); setOpen(true); }}
          className={
            floating
              ? "cq-metal fixed bottom-4 right-4 z-40 flex items-center gap-1.5 rounded-sm border border-brass/50 bg-card/90 px-3 py-2 font-heading uppercase tracking-[0.15em] text-[10px] text-brass-bright"
              : "p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors"
          }
          aria-label="Manage operation"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {floating && "Manage Front"}
        </button>
      </CommandTip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="cq-slip max-w-md border-0 bg-transparent p-0">
          <div className="cq-hazard" />
          <div className="p-4 space-y-4">
            <div>
              <p className="cq-label text-brass/80">Operation Command</p>
              <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mt-0.5">
                HOST AUTHORITY · {game.name?.toUpperCase()}
              </p>
            </div>

            {/* Redesignation */}
            <div>
              <label className="cq-label">Operation Name</label>
              <div className="flex gap-2 mt-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border font-heading tracking-wide" />
                <Button size="sm" variant="outline" disabled={busy || !name.trim() || name.trim() === game.name}
                  onClick={() => call({ action: "updateSettings", name })}>
                  Amend
                </Button>
              </div>
            </div>

            {/* Campaign directive */}
            {game.mode === "campaign" && (
              <div className="border-t border-border pt-3">
                <label className="cq-label text-brass">Campaign Victory Directive</label>
                <div className="grid grid-cols-[1fr_80px_auto] gap-2 mt-1">
                  <select value={winType} onChange={(e) => setWinType(e.target.value)}
                    className="bg-input border border-border rounded-sm p-2 text-sm text-secondary-foreground font-heading tracking-wide">
                    <option value="territory">Control % of settlements</option>
                    <option value="survive">Survive N days</option>
                  </select>
                  <Input type="number" value={winValue} onChange={(e) => setWinValue(e.target.value)} className="bg-input border-border" />
                  <Button size="sm" variant="outline" disabled={busy}
                    onClick={() => call({ action: "updateSettings", campaignWinCondition: { type: winType, value: winValue } })}>
                    Amend
                  </Button>
                </div>
              </div>
            )}

            {/* Suspension */}
            <div className="border-t border-border pt-3 flex flex-wrap gap-2">
              {game.status === "paused" ? (
                <Button size="sm" disabled={busy} onClick={() => call({ action: "resumeGame" })}
                  className="font-heading uppercase text-xs tracking-[0.2em]">
                  <Play className="w-3.5 h-3.5" /> Resume Operations
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => call({ action: "pauseGame" })}
                  className="font-heading uppercase text-xs tracking-[0.2em]">
                  <Pause className="w-3.5 h-3.5" /> Suspend Front
                </Button>
              )}
              {confirmCancel ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="destructive" disabled={busy} onClick={() => call({ action: "cancelGame" })}
                    className="font-heading uppercase text-xs tracking-[0.2em]">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Confirm Strike
                  </Button>
                  <button onClick={() => setConfirmCancel(false)} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
                    STAND DOWN
                  </button>
                </div>
              ) : (
                <Button size="sm" variant="destructive" disabled={busy} onClick={() => setConfirmCancel(true)}
                  className="font-heading uppercase text-xs tracking-[0.2em]">
                  <Ban className="w-3.5 h-3.5" /> Strike from Register
                </Button>
              )}
            </div>
            <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.2em]">
              SUSPENSION HOLDS ALL ORDERS · A STRUCK FRONT ENDS WITHOUT DECISION AND CANNOT BE REOPENED
            </p>

            {error && <p className="font-mono text-[10px] text-rust tracking-wide border border-rust/40 bg-rust/10 rounded-sm px-2 py-1.5">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}