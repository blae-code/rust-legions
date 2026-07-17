import React from "react";
import { AlertTriangle } from "lucide-react";

// Renders one Field Manual content block in dieselpunk styling.
// Block schema is documented in src/lib/fieldManual.js.

export default function ManualBlock({ block }) {
  if (block.lead) {
    return <p className="font-heading text-brass-bright text-lg leading-snug tracking-wide mb-3">{block.lead}</p>;
  }

  if (block.h) {
    return <h4 className="cq-label mt-5 mb-2">{block.h}</h4>;
  }

  if (block.p) {
    return <p className="text-sm text-foreground/90 leading-relaxed mb-3 max-w-3xl">{block.p}</p>;
  }

  if (block.list) {
    return (
      <ul className="space-y-1.5 mb-3 max-w-3xl">
        {block.list.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-foreground/90 leading-relaxed">
            <span className="text-brass shrink-0 mt-0.5">▸</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.note) {
    return (
      <div className="cq-panel border-rust/40 my-4 p-3 flex gap-2.5 items-start">
        <AlertTriangle className="w-4 h-4 text-rust shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">{block.note}</p>
      </div>
    );
  }

  if (block.quote) {
    return (
      <blockquote className="border-l-2 border-brass/50 pl-4 my-4 max-w-3xl">
        <p className="text-sm italic text-foreground/80 leading-relaxed">“{block.quote}”</p>
        {block.cite && <footer className="text-xs font-mono text-muted-foreground mt-1">— {block.cite}</footer>}
      </blockquote>
    );
  }

  if (block.table) {
    const { head, rows } = block.table;
    return (
      <div className="my-4 overflow-x-auto cq-panel p-0">
        <table className="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-brass/30">
              {head.map((h, i) => (
                <th
                  key={i}
                  className="text-left font-heading uppercase tracking-wider text-brass px-3 py-2 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 ? "bg-secondary/20" : ""}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-3 py-1.5 align-top border-b border-border/30 ${
                      ci === 0 ? "font-heading tracking-wide text-foreground whitespace-nowrap" : "text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}
