import React, { useRef, useState, useEffect } from "react";

const BG_URL = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/b35bbbd2b_generated_image.png";

// Mid-ground silhouette skyline — derricks, smokestacks, ruined gantries
const Skyline = () => (
  <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" className="w-full h-full" aria-hidden="true">
    <g fill="hsl(26 20% 5%)">
      <path d="M0 200 L0 150 L40 150 L48 90 L56 150 L120 150 L120 200 Z" />
      <path d="M150 200 L150 120 L165 120 L165 70 L175 70 L175 120 L190 120 L190 200 Z" />
      <path d="M230 200 L230 140 L250 60 L255 60 L275 140 L275 200 Z" />
      <rect x="320" y="110" width="14" height="90" />
      <rect x="345" y="90" width="10" height="110" />
      <path d="M420 200 L420 130 L500 130 L510 100 L520 130 L560 130 L560 200 Z" />
      <path d="M640 200 L640 145 L648 80 L656 145 L700 145 L700 200 Z" />
      <rect x="750" y="120" width="16" height="80" />
      <path d="M810 200 L810 150 L830 150 L838 65 L846 150 L900 150 L900 200 Z" />
      <path d="M950 200 L950 135 L970 55 L976 55 L996 135 L996 200 Z" />
      <rect x="1050" y="100" width="10" height="100" />
      <rect x="1075" y="125" width="18" height="75" />
      <path d="M1130 200 L1130 140 L1200 140 L1200 200 Z" />
    </g>
  </svg>
);

// Foreground silhouettes — hulking tank & wire posts, nearly black
const Foreground = () => (
  <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice" className="w-full h-full" aria-hidden="true">
    <g fill="hsl(26 24% 3%)">
      {/* Riveted crawler tank */}
      <path d="M60 160 L60 122 Q60 106 84 106 L200 106 Q226 106 226 124 L226 160 Z" />
      <rect x="112" y="82" width="70" height="28" rx="4" />
      <rect x="178" y="90" width="86" height="7" rx="2" />
      {/* Wire posts */}
      <path d="M420 160 L424 108 L430 160 Z" />
      <path d="M560 160 L564 116 L570 160 Z" />
      <path d="M700 160 L704 104 L710 160 Z" />
      <path d="M412 122 Q495 108 578 126 Q660 140 716 114" stroke="hsl(26 24% 3%)" strokeWidth="2" fill="none" />
      {/* Sandbag mound */}
      <path d="M880 160 Q900 132 950 134 Q1010 130 1040 148 Q1070 138 1100 160 Z" />
      {/* Ruined wall */}
      <path d="M1140 160 L1140 118 L1160 118 L1160 100 L1178 100 L1178 130 L1200 130 L1200 160 Z" />
    </g>
  </svg>
);

// 2.5D layered war-front backdrop — painted matte + parallax silhouette planes
export default function WarTable25D() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const raf = useRef(null);

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

  const layer = (depth) => ({
    transform: `translate3d(${offset.x * depth}px, ${offset.y * depth * 0.5}px, 0) scale(1.06)`,
    transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Far plane — painted battlefield */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_URL})`, ...layer(-8) }}
      />
      {/* Sweeping searchlight beam */}
      <div className="absolute inset-0 cq-searchlight" />
      {/* Mid plane — industrial skyline silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-[38%]" style={layer(-16)}>
        <Skyline />
      </div>
      {/* Drifting smoke between planes */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 cq-smoke" />
      {/* Near plane — trench-line silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-[24%]" style={layer(-30)}>
        <Foreground />
      </div>
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