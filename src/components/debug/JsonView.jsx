import React, { useState } from "react";

// Minimal collapsible JSON tree. No dependencies — used by the Dev Console
// State and Network tabs. Objects/arrays collapse; primitives render inline.

const typeColor = (v) => {
  if (v === null || v === undefined) return "text-muted-foreground";
  switch (typeof v) {
    case "number":
      return "text-brass-bright";
    case "boolean":
      return "text-olive";
    case "string":
      return "text-foreground";
    default:
      return "text-muted-foreground";
  }
};

function Leaf({ value }) {
  const label = value === undefined ? "undefined" : typeof value === "string" ? `"${value}"` : JSON.stringify(value);
  return <span className={typeColor(value)}>{label}</span>;
}

function Node({ k, value, depth, defaultOpen }) {
  const isObj = value && typeof value === "object";
  const [open, setOpen] = useState(defaultOpen ?? depth < 1);

  if (!isObj) {
    return (
      <div className="whitespace-pre-wrap break-all leading-5" style={{ paddingLeft: depth * 12 }}>
        {k !== undefined && <span className="text-brass/80">{k}: </span>}
        <Leaf value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value);
  const brace = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  const count = entries.length;

  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-left hover:text-brass-bright transition-colors leading-5"
      >
        <span className="text-brass/60 inline-block w-3">{open ? "▾" : "▸"}</span>
        {k !== undefined && <span className="text-brass/80">{k}: </span>}
        <span className="text-muted-foreground">
          {brace[0]}
          {!open && <span className="opacity-60">{count} </span>}
          {!open && brace[1]}
        </span>
      </button>
      {open && (
        <div>
          {entries.map(([ck, cv]) => (
            <Node key={ck} k={ck} value={cv} depth={depth + 1} />
          ))}
          <div className="text-muted-foreground leading-5" style={{ paddingLeft: 0 }}>
            {brace[1]}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JsonView({ data, defaultOpen }) {
  return (
    <div className="font-mono text-[11px]">
      <Node value={data} depth={0} defaultOpen={defaultOpen} />
    </div>
  );
}
