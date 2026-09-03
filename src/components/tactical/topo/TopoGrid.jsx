import React from "react";
import { INK } from "@/lib/tactical/topoStyle";

// The ruled grid, printed OVER the ground the way a military sheet is: a fine
// square graticule, a heavier reference square every fifth line, and margin
// ticks along the sheet edge.
export default function TopoGrid({ x, y, width, height }) {
  return (
    <g pointerEvents="none">
      <rect x={x} y={y} width={width} height={height} fill="url(#topo_grid)" />
      <rect x={x} y={y} width={width} height={height} fill="url(#topo_grid_coarse)" />
      <rect
        x={x + 2}
        y={y + 2}
        width={width - 4}
        height={height - 4}
        fill="none"
        stroke={INK.line}
        strokeWidth="1.6"
        opacity="0.5"
      />
    </g>
  );
}