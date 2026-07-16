import React from "react";
import { HOUSE_STYLE } from "@/lib/imageLibrary";

export default function AssetCard({ asset }) {
  return (
    <div className="cq-panel p-3 flex flex-col">
      <div className={`relative w-full rounded-sm border border-dashed border-border bg-background/60 overflow-hidden ${
        asset.aspect === "16:9" ? "aspect-video" : asset.aspect === "4:3" ? "aspect-[4/3]" : "aspect-square"
      }`}>
        {asset.url ? (
          <img src={asset.url} alt={asset.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="cq-stamp text-[10px]">Awaiting Plate</span>
            <span className="font-mono text-[8px] text-muted-foreground/60 tracking-widest">{asset.aspect} · {asset.key.toUpperCase()}</span>
          </div>
        )}
      </div>
      <p className="font-heading text-sm tracking-wide text-secondary-foreground mt-2">{asset.title}</p>
      <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{asset.desc}</p>
      <details className="mt-1.5">
        <summary className="cq-label cursor-pointer text-[9px] hover:text-brass-bright">Generation brief</summary>
        <p className="font-mono text-[9px] text-muted-foreground/80 leading-relaxed mt-1 border-l-2 border-brass/40 pl-2">
          {asset.prompt} — {HOUSE_STYLE}
        </p>
      </details>
    </div>
  );
}