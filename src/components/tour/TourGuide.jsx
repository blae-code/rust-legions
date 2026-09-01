import React, { useCallback, useEffect, useState } from "react";
import TourCard from "@/components/tour/TourCard";
import { playSfx } from "@/lib/sfx";

const q = (target) => document.querySelector(`[data-tour="${target}"]`);

// The guided tour engine — dims the war room and cuts a brass-braced spotlight
// around each surface in turn, sliding heavily between targets, with a
// briefing card pinned alongside. Steps missing from the DOM are skipped.
export default function TourGuide({ open, steps, onClose }) {
  const [liveSteps, setLiveSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);

  // On open, keep only the steps whose target is actually on this screen
  useEffect(() => {
    if (!open) return;
    setLiveSteps(steps.filter((s) => q(s.target)));
    setIdx(0);
    setRect(null);
  }, [open, steps]);

  const step = liveSteps[idx];

  const measure = useCallback(() => {
    if (!step) return;
    const el = q(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  useEffect(() => {
    if (!open || !step) return;
    q(step.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  if (!open || !step) return null;

  const pad = 10;
  const spot = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
  const below = spot ? spot.top + spot.height + 220 < window.innerHeight : true;
  const cardStyle = spot
    ? {
        top: below ? spot.top + spot.height + 14 : Math.max(spot.top - 215, 12),
        left: Math.min(Math.max(spot.left, 16), Math.max(window.innerWidth - 364, 16)),
      }
    : { top: "40%", left: "calc(50% - 170px)" };

  const advance = (d) => {
    playSfx("select");
    if (idx + d >= liveSteps.length) onClose();
    else setIdx(Math.max(idx + d, 0));
  };

  return (
    <div className="fixed inset-0 z-[80]">
      {/* Grit & scanlines over the darkened room */}
      <div className="absolute inset-0 cq-scanlines opacity-30" />
      <div className="absolute inset-0 cq-vignette" />
      {spot ? (
        <div
          className="absolute rounded-sm cq-brackets"
          style={{
            ...spot,
            boxShadow:
              "0 0 0 9999px rgba(5, 7, 9, 0.86), 0 0 22px 2px hsl(var(--brass) / 0.28), inset 0 0 18px hsl(var(--brass) / 0.10)",
            border: "1px solid hsl(var(--brass) / 0.75)",
            transition: "all 0.55s cubic-bezier(0.3, 0, 0.2, 1)",
          }}
        >
          {/* Hazard-taped survey frame on the spotlit surface */}
          <span className="absolute -top-[3px] left-0 right-0 h-[3px] opacity-80" style={{ background: "repeating-linear-gradient(-45deg, hsl(var(--brass)) 0 6px, transparent 6px 12px)" }} />
          <span className="absolute -bottom-[3px] left-0 right-0 h-[3px] opacity-80" style={{ background: "repeating-linear-gradient(-45deg, hsl(var(--brass)) 0 6px, transparent 6px 12px)" }} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-black/85" />
      )}
      <TourCard step={step} idx={idx} total={liveSteps.length} onPrev={() => advance(-1)} onNext={() => advance(1)} onSkip={onClose} style={cardStyle} />
    </div>
  );
}