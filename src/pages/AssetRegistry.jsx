import React from "react";
import { IMAGE_LIBRARY, IMAGE_CATEGORIES, libraryStats, HOUSE_STYLE } from "@/lib/imageLibrary";
import AssetCategorySection from "@/components/assets/AssetCategorySection";

export default function AssetRegistry() {
  const stats = libraryStats();
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="cq-panel cq-brackets relative overflow-hidden p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <p className="cq-label text-rust pt-1">Ministry of War · Propaganda &amp; Illustration Directorate</p>
        <h1 className="cq-display text-3xl">The Asset Registry</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          The master catalog of every art plate the war effort requires. Each entry carries its usage and a
          generation brief; plates marked <span className="text-rust">Awaiting Plate</span> are yet to be produced.
        </p>
        <div className="flex flex-wrap gap-4 mt-3 font-mono text-[10px] text-secondary-foreground tracking-widest">
          <span>PLATES COMMISSIONED: {stats.total}</span>
          <span className="text-olive">DELIVERED: {stats.delivered}</span>
          <span className="text-brass">OUTSTANDING: {stats.total - stats.delivered}</span>
        </div>
        <p className="font-mono text-[9px] text-muted-foreground/70 mt-3 border-l-2 border-brass/40 pl-2 max-w-3xl leading-relaxed">
          HOUSE STYLE (APPENDED TO EVERY BRIEF): {HOUSE_STYLE}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {Object.entries(IMAGE_CATEGORIES).map(([key, meta]) => (
            <a key={key} href={`#${key}`} className="cq-tag border-border text-muted-foreground hover:border-brass/60 hover:text-brass-bright transition-colors">
              {meta.label}
            </a>
          ))}
        </div>
      </div>

      {Object.entries(IMAGE_CATEGORIES).map(([key, meta]) => (
        <AssetCategorySection key={key} id={key} meta={meta}
          assets={IMAGE_LIBRARY.filter((a) => a.category === key)} />
      ))}
    </div>
  );
}