// The Protectorate Register — every surveyed settlement under your flag, with its
// filed history, standing accord, and what it actually pays into the war chest.
// Display mirror only; the engine stays authoritative.
import { SETTLEMENT_YIELD, KIND_LABEL } from "@/lib/macro/ledger";
import { policyById, POLICY_COOLDOWN_DAYS } from "@/lib/settlementPolicy";

const RES = ["manpower", "steel", "fuel"];

// Base yield reshaped by the standing accord (mirrors gameEngine policy yields)
export function effectiveYield(kind, policyId) {
  const base = SETTLEMENT_YIELD[kind] || {};
  const out = { manpower: base.manpower || 0, steel: base.steel || 0, fuel: base.fuel || 0 };
  if (policyId === "integrate") out.manpower += 2;
  if (policyId === "trade") { out.steel += 1; out.fuel += 1; }
  if (policyId === "tax") for (const k of RES) out[k] *= 2;
  return out;
}

export function protectorateReport(game) {
  const macro = game?.macro || {};
  const mine = game?.mySlot;
  const empty = { entries: [], totals: { manpower: 0, steel: 0, fuel: 0 }, unsettled: 0 };
  if (mine === null || mine === undefined) return empty;

  const dossiers = Object.fromEntries((macro.dossiers || []).map((d) => [d.nodeId, d]));
  const supplied = new Set(macro.supplied || []);

  const entries = (macro.nodes || [])
    .filter((n) => macro.control?.[n.id] === mine && dossiers[n.id])
    .map((n) => {
      const dossier = dossiers[n.id];
      const standing = macro.policies?.[n.id] || null;
      const policy = standing ? policyById(standing.policy) : null;
      const daysHeld = standing ? game.turnNumber - standing.since : 0;
      return {
        id: n.id,
        name: n.name,
        kind: n.kind,
        kindLabel: KIND_LABEL[n.kind] || n.kind,
        dossier,
        charter: dossier.charter || null,
        policy,
        policySince: standing?.since ?? null,
        locked: !!standing && daysHeld < POLICY_COOLDOWN_DAYS,
        daysLeft: standing ? Math.max(0, POLICY_COOLDOWN_DAYS - daysHeld) : 0,
        inSupply: supplied.has(n.id),
        yield: effectiveYield(n.kind, standing?.policy),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totals = { manpower: 0, steel: 0, fuel: 0 };
  for (const e of entries) {
    if (!e.inSupply) continue;
    for (const k of RES) totals[k] += e.yield[k];
  }

  return { entries, totals, unsettled: entries.filter((e) => !e.policy).length };
}