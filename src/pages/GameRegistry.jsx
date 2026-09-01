import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Loader2, ShieldAlert, RotateCw } from "lucide-react";
import RegistryRow from "@/components/admin/RegistryRow";
import { playSfx } from "@/lib/sfx";

const LIVE = ["lobby", "active", "paused"];

// Ministry oversight — every front on file, live or archived, fully manageable.
export default function GameRegistry() {
  const { user } = useUser();
  const [games, setGames] = useState(null);
  const [tab, setTab] = useState("live");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    base44.functions.invoke("gameAdmin", { action: "listGames" })
      .then((r) => setGames(r.data.games || []))
      .catch((e) => setError(e.response?.data?.error || "The register could not be raised"));
  }, []);

  useEffect(() => { if (user?.role === "admin") load(); }, [user, load]);

  const act = async (gameId, action) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("gameAdmin", { gameId, action });
      playSfx("select");
      load();
    } catch (e) {
      setError(e.response?.data?.error || "The order was refused");
    }
    setBusy(false);
  };

  if (user && user.role !== "admin") {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <ShieldAlert className="w-8 h-8 mx-auto text-rust" />
        <p className="cq-display text-2xl mt-3">Ministry Clearance Required</p>
        <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] mt-2">THIS REGISTER IS RESTRICTED TO THE MINISTRY OF WAR</p>
      </div>
    );
  }

  const shown = (games || []).filter((g) => (tab === "live" ? LIVE.includes(g.status) : !LIVE.includes(g.status)));

  return (
    <div className="max-w-4xl mx-auto space-y-4 cq-page-in">
      <div>
        <p className="cq-label text-rust">War Ministry · Oversight Directorate</p>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h1 className="cq-display text-4xl">The Front Register</h1>
          <button onClick={() => { playSfx("select"); load(); }}
            className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-brass hover:border-brass/60 transition-colors" aria-label="Refresh">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="cq-hazard mt-2" />
      </div>

      <div className="flex gap-1.5">
        {[["live", `Live Fronts (${(games || []).filter((g) => LIVE.includes(g.status)).length})`],
          ["archived", `Archived (${(games || []).filter((g) => !LIVE.includes(g.status)).length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`font-heading uppercase tracking-[0.15em] text-[10px] px-3 py-1.5 rounded-sm border transition-colors ${
              tab === key ? "border-brass/60 bg-brass/15 text-brass-bright" : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="font-mono text-[10px] text-rust tracking-wide border border-rust/40 bg-rust/10 rounded-sm px-2 py-1.5">{error}</p>}

      {games === null ? (
        <div className="flex items-center gap-2 py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-brass/70" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-[0.25em]">PULLING THE REGISTER…</span>
        </div>
      ) : shown.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] text-center py-10">
          {tab === "live" ? "NO LIVE FRONT STANDS ON THE REGISTER." : "THE ARCHIVE SHELF IS BARE."}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((g) => (
            <RegistryRow key={g.id} game={g} busy={busy} onAction={act} />
          ))}
        </div>
      )}

      <p className="font-mono text-[8px] text-muted-foreground/50 tracking-[0.25em] text-center pt-2">
        OVERSIGHT ACTIONS ARE LOGGED IN EACH FRONT'S WAR CHRONICLE
      </p>
    </div>
  );
}