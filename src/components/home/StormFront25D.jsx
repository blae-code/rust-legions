import React, { useRef, useState, useEffect } from "react";
import BackdropReel from "@/components/home/BackdropReel";

// The war-front reel playlist — clips play in sequence with a crossfade,
// so total loop length is the sum of all reels (~14s and growing).
// PATCH HOOK: when a new patch lands, append its reel here
// (e.g. an aircraft flyover clip for the air expansion, ships for the naval one).
const BACKDROP_REELS = [
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/5ad99560d_Trench_Front_Loop.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/c21462f14_generated_video.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/abd89b870_Fortress_March_Loop.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/65441df87_Rain_Trench_Loop.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/660812b1e_Foundry_Ruins_Loop.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/375aea70a_Fog_Convoy_Loop.mp4",
  "https://media.base44.com/videos/public/6a58196dcd485ecc774cae1b/6643b9f16_Searchlights_Loop.mp4",
];

// Jagged lightning bolt rendered during a strike
const Bolt = ({ x }) => (
  <svg
    className="absolute cq-bolt"
    style={{ left: `${x}%`, top: "2%", width: "5%", height: "34%" }}
    viewBox="0 0 60 300"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path
      d="M30 0 L22 70 L38 78 L18 150 L34 158 L14 230 L26 236 L10 300"
      stroke="hsl(210 60% 88%)"
      strokeWidth="2.5"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
);

// Artillery emplacement positions deep on the horizon (x%, y%)
const GUN_POSTS = [
  [12, 58], [24, 56], [43, 59], [58, 57], [72, 58], [86, 56],
];

// 2.5D storm-front backdrop — painted dusk landscape, live lightning & artillery, ambient audio
export default function StormFront25D() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [strike, setStrike] = useState(null); // { x, bolt, key }
  const [shot, setShot] = useState(null); // { x, y, key }
  const raf = useRef(null);

  // Pointer parallax
  useEffect(() => {
    const onMove = (e) => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        setOffset({
          x: (e.clientX / window.innerWidth - 0.5) * 2,
          y: (e.clientY / window.innerHeight - 0.5) * 2,
        });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  // The menu score is owned by the app-wide MusicController in the layout.

  // Lightning — random strikes in the distant clouds; thunder arrives late
  useEffect(() => {
    let alive = true;
    let t;
    const schedule = (first) => {
      t = setTimeout(() => {
        if (!alive) return;
        const x = 10 + Math.random() * 78;
        setStrike({ x, bolt: Math.random() < 0.55, key: Date.now() });
        schedule(false);
      }, first ? 2500 + Math.random() * 3000 : 6000 + Math.random() * 10000);
    };
    schedule(true);
    return () => { alive = false; clearTimeout(t); };
  }, []);

  // Artillery — batteries fire along the horizon; the report rolls in behind the flash
  useEffect(() => {
    let alive = true;
    let t;
    const schedule = (first) => {
      t = setTimeout(() => {
        if (!alive) return;
        const [x, y] = GUN_POSTS[Math.floor(Math.random() * GUN_POSTS.length)];
        setShot({ x: x + (Math.random() * 4 - 2), y, key: Date.now() });
        schedule(false);
      }, first ? 1500 + Math.random() * 2000 : 3500 + Math.random() * 6500);
    };
    schedule(true);
    return () => { alive = false; clearTimeout(t); };
  }, []);

  const layer = (depth) => ({
    transform: `translate3d(${offset.x * depth}px, ${offset.y * depth * 0.5}px, 0) scale(1.06)`,
    transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Far plane — living storm-dusk landscape, rotating reel playlist */}
      <BackdropReel reels={BACKDROP_REELS} style={layer(-8)} />

      {/* Lightning strike — cloud-lit sky wash, optional bolt, brief ground glare */}
      {strike && (
        <React.Fragment key={`strike-${strike.key}`}>
          <div
            className="absolute inset-0 cq-lightning"
            style={{
              background: `radial-gradient(ellipse 42% 30% at ${strike.x}% 14%, hsl(215 55% 80% / 0.55), hsl(215 45% 65% / 0.15) 55%, transparent 75%)`,
            }}
          />
          {strike.bolt && <Bolt x={strike.x} />}
          <div className="absolute inset-0 cq-lightning-glare" />
        </React.Fragment>
      )}

      {/* Artillery muzzle flash + rising smoke on the horizon */}
      {shot && (
        <React.Fragment key={`shot-${shot.key}`}>
          <div className="cq-arty-flash" style={{ left: `${shot.x}%`, top: `${shot.y}%` }} />
          <div className="cq-arty-glow" style={{ left: `${shot.x}%`, top: `${shot.y}%` }} />
        </React.Fragment>
      )}

      {/* Drifting smoke between planes */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 cq-smoke" />

      {/* Rising embers */}
      {[...Array(14)].map((_, i) => (
        <span
          key={i}
          className="cq-ember"
          style={{
            left: `${(i * 71) % 100}%`,
            animationDelay: `${(i * 1.7) % 9}s`,
            animationDuration: `${7 + (i % 5) * 2}s`,
          }}
        />
      ))}
    </div>
  );
}