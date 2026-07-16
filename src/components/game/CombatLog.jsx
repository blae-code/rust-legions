import React from "react";

export default function CombatLog({ entries = [] }) {
  return (
    <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-4">
      <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">Field Reports</h3>
      <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
        {entries.length === 0 && <p className="text-stone-600">No engagements reported.</p>}
        {[...entries].reverse().map((e, i) => (
          <div key={i} className="text-stone-400 border-l-2 border-stone-700 pl-2">
            <span className="text-stone-600 font-mono mr-1">T{e.turn}</span>
            {e.type === "event" ? (
              <span className="text-amber-600">{e.text}</span>
            ) : (
              <span>
                <span className="text-stone-300">{e.attacker}</span> assaulted{" "}
                <span className="text-stone-300">{e.tileName}</span> ({e.defender}) —{" "}
                {e.outcome === "captured" && <span className="text-green-500">zone captured</span>}
                {e.outcome === "repelled" && <span className="text-red-500">assault repelled</span>}
                {e.outcome === "retreated" && <span className="text-yellow-600">forces withdrew</span>}
                {" "}· losses {e.attLosses}/{e.defLosses}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}