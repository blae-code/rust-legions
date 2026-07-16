import React, { useMemo, useRef, useState, useEffect } from "react";
import UnitSprite from "@/components/game/sprites/UnitSprite";

const MAX = 7;

// Proportional representative sprite lineup for a force
const spriteList = (units = {}) => {
  const keys = Object.keys(units).filter((k) => (units[k] || 0) > 0);
  const total = keys.reduce((s, k) => s + units[k], 0);
  if (!total) return [];
  const out = [];
  for (const k of keys) {
    const n = Math.max(1, Math.round((units[k] / total) * MAX));
    for (let i = 0; i < n && out.length < MAX; i++) out.push(k);
  }
  return out;
};

const dominantType = (units = {}) =>
  Object.keys(units).reduce((best, k) => ((units[k] || 0) > (units[best] || 0) ? k : best), "riflemen");

export default function BattleDiorama({ attacker, defender, fx }) {
  const [firing, setFiring] = useState(false);
  const [booms, setBooms] = useState([]);
  const [fallen, setFallen] = useState([]);
  const prevLosses = useRef({ a: attacker.losses, d: defender.losses });

  // A round resolved — attackers lunge, volley fire, casualties topple where shells land
  useEffect(() => {
    if (!fx) return;
    const lostA = attacker.losses - prevLosses.current.a;
    const lostD = defender.losses - prevLosses.current.d;
    prevLosses.current = { a: attacker.losses, d: defender.losses };
    setFiring(true);
    const boomList = [];
    const fallList = [];
    const aType = dominantType(attacker.units);
    const dType = dominantType(defender.units);
    for (let i = 0; i < Math.min(Math.max(lostA, 0), 3); i++) {
      const x = 7 + Math.random() * 26;
      const y = 8 + Math.random() * 26;
      boomList.push({ id: `a${fx}${i}`, x, y });
      fallList.push({ id: `fa${fx}${i}`, x, y: y - 2, type: aType, facing: "right", delay: 0.15 + i * 0.12 });
    }
    for (let i = 0; i < Math.min(Math.max(lostD, 0), 3); i++) {
      const x = 66 + Math.random() * 26;
      const y = 8 + Math.random() * 26;
      boomList.push({ id: `d${fx}${i}`, x, y });
      fallList.push({ id: `fd${fx}${i}`, x, y: y - 2, type: dType, facing: "left", delay: 0.15 + i * 0.12 });
    }
    setBooms(boomList);
    setFallen(fallList);
    const t = setTimeout(() => { setFiring(false); setBooms([]); setFallen([]); }, 1500);
    return () => clearTimeout(t);
  }, [fx]);  

  const aSprites = useMemo(() => spriteList(attacker.units), [attacker.units]);
  const dSprites = useMemo(() => spriteList(defender.units), [defender.units]);

  const spriteStyle = (i, k, side) => ({
    [side === "a" ? "left" : "right"]: `${4 + i * 5.5}%`,
    bottom: `${6 + (i % 2) * 15 + (k === "fighter" ? 40 : 0)}px`,
    animation: `cq-bob ${2 + (i % 3) * 0.4}s ease-in-out ${i * 0.23}s infinite`,
  });

  return (
    <div className="relative h-28 mb-4 rounded-sm border border-border overflow-hidden select-none">
      {/* Night battlefield backdrop with fire glow on the horizon */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#0B0908 0%,#161110 50%,#2A1D10 84%,#3D2812 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none" style={{ background: "radial-gradient(ellipse 65% 100% at 50% 100%, rgba(224,140,46,0.16), transparent 70%)" }} />
      <div className="absolute inset-x-0 bottom-[7px] h-px bg-black/70" />

      {aSprites.map((k, i) => (
        <div key={`a${i}`} className="absolute" style={spriteStyle(i, k, "a")}>
          <div className={firing ? "cq-lunge" : undefined} style={firing ? { animationDelay: `${i * 0.07}s` } : undefined}>
            <UnitSprite type={k} facing="right" className="w-8 h-8 opacity-90" />
            {firing && k !== "fighter" && <div className="cq-muzzle" style={{ position: "absolute", right: -5, top: "36%" }} />}
          </div>
        </div>
      ))}
      {dSprites.map((k, i) => (
        <div key={`d${i}`} className="absolute" style={spriteStyle(i, k, "d")}>
          <div className={firing ? "cq-recoil" : undefined} style={firing ? { animationDelay: `${0.12 + i * 0.07}s` } : undefined}>
            <UnitSprite type={k} facing="left" className="w-8 h-8 opacity-90" />
            {firing && k !== "fighter" && <div className="cq-muzzle" style={{ position: "absolute", left: -5, top: "36%" }} />}
          </div>
        </div>
      ))}

      {firing && [0, 1, 2].map((i) => (
        <div key={`t${i}`} className="cq-tracer" style={{ top: `${32 + i * 15}%`, animationDelay: `${i * 0.13}s` }} />
      ))}
      {firing && [0, 1, 2].map((i) => (
        <div key={`r${i}`} className="cq-tracer-rev" style={{ top: `${38 + i * 15}%`, animationDelay: `${0.07 + i * 0.13}s` }} />
      ))}
      {booms.map((b) => (
        <div key={b.id} className="cq-boom" style={{ left: `${b.x}%`, bottom: b.y }} />
      ))}
      {/* Casualties — silhouettes topple where the shells landed */}
      {fallen.map((f) => (
        <div key={f.id} className="absolute cq-fall" style={{ left: `${f.x}%`, bottom: f.y, animationDelay: `${f.delay}s` }}>
          <UnitSprite type={f.type} facing={f.facing} className="w-8 h-8" />
        </div>
      ))}

      <p className="absolute top-1 left-2 font-mono text-[8px] text-[#C9752E] tracking-[0.25em]">ATTACKER</p>
      <p className="absolute top-1 right-2 font-mono text-[8px] text-[#7A93A5] tracking-[0.25em]">DEFENDER</p>
    </div>
  );
}