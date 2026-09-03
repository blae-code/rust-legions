import React from "react";
import { PLATE_URLS } from "@/lib/imagePlates";
import { UNIT_TYPES, CARRIES_FUEL } from "@/lib/tactical/orbat";
import ActivityBadge from "./ActivityBadge";

// A stamped unit counter — the readable object of a hex wargame. Local coords
// are centred on 0,0 so the board only has to translate it onto a hex.
const W = 38;
const H = 34;
const L = -W / 2;
const T = -H / 2;

const SIDE = {
  attacker: { plate: "#6E2320", edge: "#C9553F", ink: "#F2E4D6" },
  defender: { plate: "#3A4046", edge: "#98A3AC", ink: "#E8ECEF" },
};

export default function UnitCounter({ stand, selected, targeted, onSelect }) {
  const type = UNIT_TYPES[stand.type];
  const skin = SIDE[stand.side];
  const url = PLATE_URLS[type.token];
  const frac = Math.max(0, Math.min(1, stand.str / type.maxStr));
  const fuel = CARRIES_FUEL.indexOf(type.arm) !== -1 ? stand.fuel : null;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(stand);
      }}
      className="cursor-pointer"
      opacity={stand.moved ? 0.62 : 1}
    >
      {/* plate */}
      <rect x={L} y={T} width={W} height={H} fill={skin.plate} stroke={skin.edge} strokeWidth="1.2" />

      {/* portrait, cropped to the plate window */}
      {url ? (
        <image
          href={url}
          x={L + 1}
          y={T + 8}
          width={W - 2}
          height={17}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#cq_counter_window)"
        />
      ) : (
        <rect x={L + 1} y={T + 8} width={W - 2} height={17} fill="#1A1714" />
      )}

      {/* top number strip — strength · ammunition · fuel */}
      <rect x={L + 1} y={T + 1} width={W - 2} height={7} fill="#15181B" opacity="0.9" />
      <text x={L + 4} y={T + 6.6} className="font-mono" fontSize="6.2" fill={skin.ink}>
        {stand.str}
      </text>
      <text x={0} y={T + 6.6} className="font-mono" fontSize="6.2" fill="#D9C58F" textAnchor="middle">
        {stand.ammo}
      </text>
      <text x={L + W - 4} y={T + 6.6} className="font-mono" fontSize="6.2" fill="#9FB2C4" textAnchor="end">
        {fuel === null ? "–" : fuel}
      </text>

      {/* strength bar across the foot of the portrait */}
      <rect x={L + 1} y={T + 23.5} width={W - 2} height={1.6} fill="#15181B" />
      <rect
        x={L + 1}
        y={T + 23.5}
        width={(W - 2) * frac}
        height={1.6}
        fill={frac > 0.6 ? "#7E9B57" : frac > 0.3 ? "#C9922F" : "#C0392B"}
      />

      {/* foot strip — side flash, veterancy pips, entrenchment */}
      <rect x={L + 1} y={T + 25.5} width={W - 2} height={H - 26.5} fill="#15181B" opacity="0.92" />
      <rect x={L + 3} y={T + 27} width={5} height={4.5} fill={skin.edge} />
      {Array.from({ length: stand.vet || 0 }).map((_, i) => (
        <circle key={i} cx={L + 11.5 + i * 3.4} cy={T + 29.2} r="1.1" fill="#D9C58F" />
      ))}
      {Array.from({ length: stand.entrench || 0 }).map((_, i) => (
        <rect key={i} x={L + W - 5 - i * 3.2} y={T + 27.4} width="2.2" height="3.8" fill="#8A7F6B" />
      ))}

      {/* selection bracket / target ring */}
      {selected && (
        <rect x={L - 2} y={T - 2} width={W + 4} height={H + 4} fill="none" stroke="#E8D6A8" strokeWidth="1.6" />
      )}
      {targeted && (
        <rect x={L - 2} y={T - 2} width={W + 4} height={H + 4} fill="none" stroke="#E2483A" strokeWidth="1.8" />
      )}

      {/* what this stand is doing right now — the plate itself never animates */}
      <ActivityBadge activity={stand.activity} y={T - 12} />
    </g>
  );
}

// Shared crop window — userSpaceOnUse, so it travels with each counter's transform.
export function CounterDefs() {
  return (
    <defs>
      <clipPath id="cq_counter_window">
        <rect x={L + 1} y={T + 8} width={W - 2} height={17} />
      </clipPath>
    </defs>
  );
}