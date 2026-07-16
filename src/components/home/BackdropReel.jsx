import React, { useRef, useState } from "react";

// Rotating backdrop reel — plays clips in sequence with a soft crossfade,
// so the front's total loop is the sum of every reel in the playlist.
// Future patches extend the war-front by APPENDING clips to the reels array
// (e.g. an aircraft flyover reel, ships on the horizon) — no other changes needed.
export default function BackdropReel({ reels, style }) {
  const [active, setActive] = useState(0); // which of the two layers is visible
  const [srcs, setSrcs] = useState([reels[0], reels[1 % reels.length]]);
  const idxRef = useRef(0); // index in `reels` of the clip currently playing
  const vidA = useRef(null);
  const vidB = useRef(null);
  const vids = [vidA, vidB];

  // Single clip — plain seamless loop
  if (reels.length < 2) {
    return (
      <video className="absolute inset-0 w-full h-full object-cover" style={style}
        src={reels[0]} autoPlay loop muted playsInline />
    );
  }

  const handleEnded = (layer) => {
    if (layer !== active) return;
    const nextLayer = 1 - layer;
    vids[nextLayer].current?.play().catch(() => {});
    setActive(nextLayer);
    // Queue the clip after next into the now-hidden layer
    idxRef.current = (idxRef.current + 1) % reels.length;
    const upcoming = reels[(idxRef.current + 1) % reels.length];
    setSrcs((s) => { const c = [...s]; c[layer] = upcoming; return c; });
  };

  return (
    <div className="absolute inset-0" style={style}>
      {[0, 1].map((layer) => (
        <video key={layer} ref={vids[layer]}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${active === layer ? "opacity-100" : "opacity-0"}`}
          src={srcs[layer]}
          autoPlay={layer === 0}
          muted playsInline preload="auto"
          onEnded={() => handleEnded(layer)}
        />
      ))}
    </div>
  );
}