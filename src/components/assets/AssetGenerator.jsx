import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { IMAGE_LIBRARY, HOUSE_STYLE } from "@/lib/imageLibrary";

// Admin-only Directorate control: batch-commissions every plate still
// "Awaiting Plate" via the generateAssets backend function, then renders a
// paste-ready block for src/lib/imagePlates.js (PLATE_URLS) — the repo's
// established delivery convention (see that file's header).
const CHUNK = 6; // plates per backend call — keep under generateAssets MAX_BATCH (8)

export default function AssetGenerator() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [ok, setOk] = useState([]); // { key, url }
  const [failed, setFailed] = useState([]); // { key, error }
  const [error, setError] = useState(null);

  const pending = useMemo(() => IMAGE_LIBRARY.filter((p) => !p.url), []);

  useEffect(() => {
    let alive = true;
    base44.auth.me().then((u) => { if (alive) setIsAdmin(u?.role === "admin"); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!isAdmin) return null;

  const chunks = () => {
    const out = [];
    for (let i = 0; i < pending.length; i += CHUNK) out.push(pending.slice(i, i + CHUNK));
    return out;
  };

  const run = async () => {
    setRunning(true); setError(null); setOk([]); setFailed([]); setDone(0);
    const okAcc = []; const failAcc = [];
    try {
      for (const group of chunks()) {
        const items = group.map((p) => ({ key: p.key, prompt: p.prompt }));
        const res = await base44.functions.invoke("generateAssets", { style: HOUSE_STYLE, items });
        const results = res?.data?.results || [];
        for (const r of results) {
          if (r.ok && r.url) okAcc.push({ key: r.key, url: r.url });
          else failAcc.push({ key: r.key, error: r.error || "unknown" });
        }
        setOk([...okAcc]); setFailed([...failAcc]);
        setDone((d) => d + group.length);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  const pasteBlock = ok.map((r) => `  ${r.key}: "${r.url}",`).join("\n");

  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-5">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <p className="cq-label text-rust pt-1">Illustration Directorate · Commissioning Office</p>
      <h2 className="cq-display text-2xl">Batch Commission</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
        Commissions every plate still marked <span className="text-rust">Awaiting Plate</span> through the war
        artists (the <span className="font-mono text-[11px]">generateAssets</span> function). When the run
        completes, paste the block below into <span className="font-mono text-[11px]">src/lib/imagePlates.js</span>{" "}
        <span className="font-mono text-[11px]">PLATE_URLS</span> and publish.
      </p>

      <div className="flex flex-wrap items-center gap-4 mt-3 font-mono text-[10px] tracking-widest">
        <span className="text-brass">OUTSTANDING: {pending.length}</span>
        {running && <span className="text-secondary-foreground">COMMISSIONED: {done}/{pending.length}</span>}
        {!!ok.length && <span className="text-olive">DELIVERED: {ok.length}</span>}
        {!!failed.length && <span className="text-rust">REJECTED: {failed.length}</span>}
      </div>

      <button
        onClick={run}
        disabled={running || pending.length === 0}
        className="cq-metal mt-3 px-4 py-2 font-heading uppercase tracking-widest text-sm disabled:opacity-40"
      >
        {running ? "Commissioning…" : pending.length === 0 ? "All Plates Delivered" : `Commission ${pending.length} Plates`}
      </button>

      {error && <p className="font-mono text-[10px] text-rust mt-2">ERROR: {error}</p>}

      {!!ok.length && (
        <div className="mt-4">
          <p className="cq-label text-[10px]">Paste into PLATE_URLS ({ok.length} lines)</p>
          <textarea
            readOnly
            value={pasteBlock}
            onFocus={(e) => e.target.select()}
            className="w-full h-40 mt-1 bg-background/70 border border-border rounded-sm p-2 font-mono text-[10px] text-secondary-foreground"
          />
        </div>
      )}

      {!!failed.length && (
        <div className="mt-3">
          <p className="cq-label text-[10px] text-rust">Rejected briefs — re-run to retry</p>
          <ul className="font-mono text-[9px] text-muted-foreground mt-1 max-h-24 overflow-auto">
            {failed.map((f) => <li key={f.key}>{f.key}: {f.error}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
