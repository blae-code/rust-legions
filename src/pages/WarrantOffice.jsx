import React, { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IssueWarrantForm from "@/components/warrants/IssueWarrantForm";
import WarrantRow from "@/components/warrants/WarrantRow";

// The High Command's register of enlistment warrants — admins only.
export default function WarrantOffice() {
  const [codes, setCodes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("enlistmentCodes", { action: "list" });
      setCodes(res.data?.codes || []);
    } catch (e) {
      setError(e.response?.data?.error || "The register is sealed to you.");
      setCodes([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (payload) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("enlistmentCodes", payload);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "The order was refused.");
    }
    setBusy(false);
  };

  const counts = {
    open: (codes || []).filter((c) => c.status === "open").length,
    redeemed: (codes || []).filter((c) => c.status === "redeemed").length,
    revoked: (codes || []).filter((c) => c.status === "revoked").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="cq-panel relative overflow-hidden p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <p className="cq-label pt-1">High Command · Restricted</p>
        <h1 className="cq-display text-3xl">The Warrant Office</h1>
        <p className="font-body text-sm text-secondary-foreground mt-1 max-w-2xl">
          Enlistment is closed to the public. Every commander must redeem a warrant code issued here — each
          code is unique, single-use, and may be rescinded at any time to bar that commander from the app.
        </p>
        <div className="flex gap-2 flex-wrap mt-3 font-mono text-[10px] text-muted-foreground tracking-widest">
          <span className="cq-tag border-brass/50 text-brass-bright">{counts.open} UNCLAIMED</span>
          <span className="cq-tag border-olive/60 text-olive">{counts.redeemed} IN SERVICE</span>
          <span className="cq-tag border-rust/60 text-rust">{counts.revoked} RESCINDED</span>
        </div>
      </div>

      <IssueWarrantForm busy={busy} onIssue={(payload) => run({ action: "issue", ...payload })} />

      {error && <p className="font-mono text-xs text-rust">{error}</p>}

      <div className="cq-panel p-4 space-y-2">
        <p className="cq-label mb-1">The Register</p>
        {codes === null ? (
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-[10px] tracking-widest py-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> OPENING THE REGISTER…
          </div>
        ) : codes.length === 0 ? (
          <p className="font-mono text-[10px] text-muted-foreground py-3 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brass" /> NO WARRANTS STRUCK YET — ISSUE ONE ABOVE AND HAND THE CODE TO YOUR COMMANDER.
          </p>
        ) : (
          codes.map((c) => (
            <WarrantRow key={c.id} warrant={c} busy={busy} onAction={(action, id) => run({ action, id })} />
          ))
        )}
      </div>
    </div>
  );
}