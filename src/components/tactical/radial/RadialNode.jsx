import React from "react";
import { ChevronRight } from "lucide-react";
import { playSfx } from "@/lib/sfx";

// One petal of the radial. A node with children shows a chevron so the player
// knows the tree keeps expanding rather than firing an order.
export default function RadialNode({ node, index, x, y, onPick }) {
  const Icon = node.icon;
  const branch = !!node.children;
  const tone =
    node.tone === "rust"
      ? "border-rust/70 text-rust"
      : node.tone === "steel"
        ? "border-steel/70 text-steel"
        : "border-brass/70 text-brass-bright";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        playSfx("select");
        onPick(node);
      }}
      onMouseEnter={() => playSfx("hover")}
      disabled={node.disabled}
      className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 disabled:opacity-35"
      style={{ left: x, top: y }}
    >
      <span
        className={`relative w-8 h-8 rounded-full cq-metal bg-secondary border flex items-center justify-center transition-transform hover:scale-110 ${tone}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {branch && (
          <ChevronRight className="absolute -right-1 -bottom-1 w-2.5 h-2.5 text-brass bg-black/90 rounded-sm" />
        )}
        {index < 9 && (
          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-sm bg-black/90 border border-brass/50 text-brass-bright font-mono text-[7px] leading-none flex items-center justify-center">
            {index + 1}
          </span>
        )}
      </span>
      <span className="font-mono text-[8px] tracking-widest bg-black/85 border border-border px-1 py-px rounded-sm whitespace-nowrap text-brass-bright">
        {node.label.toUpperCase()}
      </span>
    </button>
  );
}