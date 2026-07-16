import React from "react";
import AssetCard from "@/components/assets/AssetCard";

export default function AssetCategorySection({ id, meta, assets }) {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {assets.map((a) => <AssetCard key={a.key} asset={a} />)}
      </div>
    </section>
  );
}