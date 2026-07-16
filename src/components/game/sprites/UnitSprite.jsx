import React from "react";

// Hand-drawn dieselpunk unit silhouettes — side view, facing right
const SPRITES = {
  riflemen: (
    <g>
      <circle cx="12" cy="8.5" r="3" />
      <rect x="8.6" y="7" width="7" height="2" rx="1" />
      <path d="M9.8 11.5 h4.6 l0.6 9 h-5.8 Z" />
      <rect x="9.6" y="20.5" width="2.2" height="8" />
      <rect x="13" y="20.5" width="2.2" height="8" />
      <rect x="13.5" y="13" width="13" height="1.7" rx="0.85" />
      <rect x="24.5" y="12" width="1.3" height="3.4" rx="0.6" />
    </g>
  ),
  crawler: (
    <g>
      <rect x="2" y="19" width="27" height="7.5" rx="3.75" />
      <circle cx="7" cy="22.7" r="2" fill="#3A322A" />
      <circle cx="12.5" cy="22.7" r="2" fill="#3A322A" />
      <circle cx="18" cy="22.7" r="2" fill="#3A322A" />
      <circle cx="23.5" cy="22.7" r="2" fill="#3A322A" />
      <path d="M4 19 h23 l-2.5 -5 h-17 Z" />
      <rect x="11" y="9" width="9.5" height="5.5" rx="1.2" />
      <rect x="19.5" y="10.6" width="11" height="2" rx="1" />
    </g>
  ),
  fighter: (
    <g>
      <ellipse cx="15" cy="16" rx="11" ry="2.6" />
      <path d="M12 16 L19 16 L15.5 22.5 Z" />
      <path d="M12 16 L19 16 L15.5 9.5 Z" opacity="0.85" />
      <rect x="3" y="10.5" width="3.5" height="6" rx="1" />
      <circle cx="26.5" cy="16" r="1.3" />
      <rect x="26.7" y="10.5" width="1" height="11" rx="0.5" opacity="0.55" />
    </g>
  ),
  artillery: (
    <g>
      <circle cx="12" cy="22.5" r="4.2" />
      <circle cx="12" cy="22.5" r="1.4" fill="#3A322A" />
      <rect x="9.5" y="15.5" width="8.5" height="5.5" rx="1.2" />
      <rect x="14" y="10" width="16" height="2.4" rx="1.2" transform="rotate(-16 14 11.2)" />
      <path d="M10 20.5 L2.5 26.5 L4.5 27.5 L12.5 22.5 Z" />
    </g>
  ),
  gunboat: (
    <g>
      <path d="M2 20 L30 20 L26 26.5 L5.5 26.5 Z" />
      <rect x="10" y="14" width="10" height="6" rx="1" />
      <rect x="18.5" y="15.3" width="9.5" height="1.9" rx="0.95" />
      <rect x="13" y="9" width="2.2" height="5.5" />
    </g>
  ),
};

export default function UnitSprite({ type, facing = "right", className = "", style }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      style={{ transform: facing === "left" ? "scaleX(-1)" : undefined, ...style }}
    >
      <g fill="#14100C" stroke="#4A3E30" strokeWidth="0.45">{SPRITES[type] || SPRITES.riflemen}</g>
    </svg>
  );
}