import React from "react";
import { AUDIO_HOUSE_STYLE } from "@/lib/audioLibrary";

function AudioAssetCard({ asset }) {
  return (
    <div className="cq-panel p-3 flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <p className="font-heading text-sm tracking-wide text-secondary-foreground">{asset.title}</p>
        <span className="font-mono text-[8px] text-muted-foreground/70 whitespace-nowrap pt-0.5">{asset.duration}</span>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{asset.desc}</p>
      <div className="mt-2">
        {asset.url ? (
          <audio controls preload="none" src={asset.url} className="w-full h-8" />
        ) : (
          <div className="flex items-center justify-center gap-2 border border-dashed border-border rounded-sm bg-background/60 py-2.5">
            <span className="cq-stamp text-[10px]">Awaiting Recording</span>
            <span className="font-mono text-[8px] text-muted-foreground/60 tracking-widest">{asset.key.toUpperCase()}</span>
          </div>
        )}
      </div>
      <details className="mt-1.5">
        <summary className="cq-label cursor-pointer text-[9px] hover:text-brass-bright">Generation brief</summary>
        <p className="font-mono text-[9px] text-muted-foreground/80 leading-relaxed mt-1 border-l-2 border-brass/40 pl-2">
          {asset.prompt} — {AUDIO_HOUSE_STYLE}
        </p>
      </details>
    </div>
  );
}

export default function AudioAssetSection({ id, meta, assets }) {
  const delivered = assets.filter((a) => a.url).length;
  return (
    <section id={id}>
      <div className="flex items-end justify-between border-b border-border pb-1.5 mb-3">
        <div>
          <h2 className="cq-display text-xl">{meta.label}</h2>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">{meta.desc.toUpperCase()}</p>
        </div>
        <span className={`cq-tag ${delivered === assets.length ? "border-olive/60 text-olive" : "border-brass/50 text-brass"}`}>
          {delivered}/{assets.length} DELIVERED
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {assets.map((a) => <AudioAssetCard key={a.key} asset={a} />)}
      </div>
    </section>
  );
}