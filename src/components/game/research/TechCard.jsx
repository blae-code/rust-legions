import React from "react";
import { getImage } from "@/lib/imageLibrary";

// One doctrine card — completed / researching / available / locked states
export default function TechCard({ techId, tech, research, busy, onFocus }) {
  const plate = getImage(`tech_${techId}`);
  const completed = (research.completed || []).includes(techId);
  const locked = tech.prereq && !(research.completed || []).includes(tech.prereq);
  const isFocus = research.focus === techId;
  const pts = (research.progress || {})[techId] || 0;

  return (
    <div className={`border rounded-sm p-2 transition-colors ${
      completed ? "border-olive/60 bg-olive/10" : isFocus ? "border-brass bg-brass/10" : locked ? "border-border opacity-45" : "border-border bg-secondary/20"
    }`}>
      <div className="flex justify-between items-center gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {plate && <img src={plate} alt="" aria-hidden="true" className="w-5 h-5 object-contain shrink-0 select-none" />}
          <span className="text-xs font-heading tracking-wide text-secondary-foreground truncate">{tech.label}</span>
        </span>
        <span className="font-mono text-[9px] shrink-0 tracking-widest text-muted-foreground">
          {completed ? <span className="text-olive">IN SERVICE</span> : `${pts}/${tech.cost} RP`}
        </span>
      </div>
      <p className="font-mono text-[9px] text-brass mt-0.5">{tech.effect}</p>
      <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{tech.desc}</p>
      {!completed && (
        locked ? (
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1.5">REQUIRES PRIOR DOCTRINE</p>
        ) : (
          <button disabled={busy} onClick={() => onFocus(isFocus ? null : techId)}
            className={`mt-1.5 w-full font-heading uppercase tracking-[0.2em] text-[9px] px-2 py-1 rounded-sm border transition-colors disabled:opacity-40 ${
              isFocus ? "border-brass text-brass-bright" : "border-border text-secondary-foreground hover:border-brass/60 hover:text-brass-bright"
            }`}>
            {isFocus ? "Researching — Stand Down" : "Set Research Focus"}
          </button>
        )
      )}
      {isFocus && !completed && (
        <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-brass" style={{ width: `${Math.min((pts / tech.cost) * 100, 100)}%` }} />
        </div>
      )}
    </div>
  );
}