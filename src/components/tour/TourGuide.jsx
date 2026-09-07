import React, { useCallback, useEffect, useRef, useState } from "react";
import TourCard from "@/components/tour/TourCard";
import placeCard from "@/lib/tourPlace";
import { playSfx } from "@/lib/sfx";

const q = (target) => document.querySelector(`[data-tour="${target}"]`);

// The guided tour engine — dims the war room and cuts a brass-braced spotlight
// around each surface in turn, sliding heavily between targets, with a
// briefing card pinned alongside. Steps missing from the DOM are skipped.
export default function TourGuide({ open, steps, onClose }) {
  const [liveSteps, setLiveSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState(null);
  const cardRef = useRef(null);
  const [card, setCard] = useState({ w: 340, h: 200 });

  // On open, keep only the steps whose target is actually on this screen
  useEffect(() => {
    if (!open) return;
    setLiveSteps(steps.filter((s) => q(s.target)));
    setIdx(0);
    setRect(null);
  }, [open, steps]);

  const step = liveSteps[idx];

  const measure = useCallback(() => {
    const el = step && q(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect((prev) =>
      prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
        ? prev
        : { top: r.top, left: r.left, width: r.width, height: r.height },
    );
    const c = cardRef.current?.getBoundingClientRect();
    if (c) setCard((p) => (p.h === c.height && p.w === c.width ? p : { w: c.width, h: c.height }));
  }, [step]);

  // The war room keeps redrawing under the tour (polled state, wrapping command
  // bar), so the box is re-surveyed on a beat rather than measured once.
  useEffect(() => {
    if (!open || !step) return;
    q(step.target)?.scrollIntoView({ behavior: "smooth", block: "center" });
    measure();
    const settle = setTimeout(measure, 450);
    const beat = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(settle);
      clearInterval(beat);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, measure]);

  // Escape always stands the tour down, whatever step is showing
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !step) return null;

  const pad = 10;
  const spot = rect && {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
  const placed = spot
    ? placeCard(spot, card, { w: window.innerWidth, h: window.innerHeight })
    : { top: window.innerHeight * 0.4, left: Math.max(window.innerWidth / 2 - card.w / 2, 12) };
  // Whatever the survey said, the card's controls must stay on screen
  placed.left = Math.max(12, Math.min(placed.left, window.innerWidth - card.w - 12));
  placed.top = Math.max(12, Math.min(placed.top, window.innerHeight - card.h - 12));

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
      <TourCard
        ref={cardRef}
        step={step}
        idx={idx}
        total={liveSteps.length}
        arrow={placed.side}
        onPrev={() => advance(-1)}
        onNext={() => advance(1)}
        onSkip={onClose}
        style={{ top: placed.top, left: placed.left }}
      />
    </div>
  );
}