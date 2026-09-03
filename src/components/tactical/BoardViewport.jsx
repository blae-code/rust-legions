import React, { useEffect, useRef } from "react";
import { Move, Search } from "lucide-react";

// The board is bigger than the desk it sits on: this is the desk. WASD (and the
// arrow keys) walk the sheet under the eye, the wheel racks the magnification.
export default function BoardViewport({ zoom, onZoom, children, height = "72vh" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const held = new Set();
    let raf = 0;

    const step = () => {
      let dx = 0;
      let dy = 0;
      if (held.has("a") || held.has("arrowleft")) dx -= 22;
      if (held.has("d") || held.has("arrowright")) dx += 22;
      if (held.has("w") || held.has("arrowup")) dy -= 22;
      if (held.has("s") || held.has("arrowdown")) dy += 22;
      if (dx || dy) el.scrollBy(dx, dy);
      raf = held.size ? requestAnimationFrame(step) : 0;
    };

    const isTyping = (t) =>
      t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

    const down = (e) => {
      if (isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) return;
      e.preventDefault();
      held.add(k);
      if (!raf) raf = requestAnimationFrame(step);
    };
    const up = (e) => held.delete(e.key.toLowerCase());
    const blur = () => held.clear();

    // The wheel racks magnification about the pointer, so the hex under the
    // cursor stays under the cursor.
    const wheel = (e) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      const px = e.clientX - box.left;
      const py = e.clientY - box.top;
      const before = { x: (el.scrollLeft + px), y: (el.scrollTop + py) };
      onZoom((z) => {
        const next = Math.min(2.6, Math.max(0.5, z * (e.deltaY > 0 ? 0.9 : 1.1)));
        const k = next / z;
        requestAnimationFrame(() => {
          el.scrollLeft = before.x * k - px;
          el.scrollTop = before.y * k - py;
        });
        return next;
      });
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      el.removeEventListener("wheel", wheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [onZoom]);

  return (
    <>
      <div ref={ref} className="overflow-auto cq-board rounded-sm" style={{ height }}>
        {children}
      </div>
      <div className="absolute bottom-2 left-2 cq-slip px-2 py-1 flex items-center gap-3 pointer-events-none">
        <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-brass-bright">
          <Move className="w-3 h-3" /> W A S D
        </span>
        <span className="flex items-center gap-1 font-mono text-[9px] tracking-widest text-brass-bright">
          <Search className="w-3 h-3" /> WHEEL · {Math.round(zoom * 100)}%
        </span>
      </div>
    </>
  );
}