import React, { useMemo } from "react";

// Industrial weld-spark burst — re-fires whenever `burst` changes
export default function BattleSparks({ burst }) {
  const sparks = useMemo(() => {
    if (!burst) return [];
    return Array.from({ length: 18 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 150;
      return {
        id: i,
        sx: `${Math.round(Math.cos(angle) * dist)}px`,
        sy: `${Math.round(Math.sin(angle) * dist - 50)}px`,
        delay: `${(Math.random() * 0.12).toFixed(2)}s`,
        size: 2 + Math.random() * 3,
        color: Math.random() < 0.72 ? "#E8A33B" : "#D9DDE2",
      };
    });
  }, [burst]);

  if (!burst) return null;
  return (
    <div key={burst} className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <div className="cq-impact-flash absolute inset-0" />
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute left-1/2 top-1/3 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 6px 1px ${s.color}`,
            "--sx": s.sx,
            "--sy": s.sy,
            animation: `cq-spark 0.7s ease-out ${s.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
}