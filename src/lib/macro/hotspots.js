// Tactical hotspot analysis — where the war has actually been hot lately.
// Three pressures are read off live state and decayed by how many days have
// passed: contact (battles), attrition (sites changing hands, stores drained),
// and traffic (columns standing on or marching through the ground).

const WINDOW = 6; // days of intelligence the staff still considers "recent"
const RESOURCE_KINDS = new Set(["city", "depot", "ruin", "town"]);

const decay = (turnNumber, turn) => {
  const age = Math.max(turnNumber - (turn || turnNumber), 0);
  return age >= WINDOW ? 0 : 1 - age / WINDOW;
};

export function computeHotspots({ nodes = [], columns = [], combatLog = [], marchPaths = [], turnNumber = 1 }) {
  const byName = {};
  for (const n of nodes) byName[n.name.toLowerCase()] = n;
  const acc = {};
  const bump = (nodeId, key, amount) => {
    if (!nodeId || !amount) return;
    const a = (acc[nodeId] = acc[nodeId] || { combat: 0, attrition: 0, traffic: 0 });
    a[key] += amount;
  };

  // Contact & attrition — read from the field reports
  for (const e of combatLog) {
    const node = byName[String(e.tileName || "").toLowerCase()];
    if (!node) continue;
    const w = decay(turnNumber, e.turn);
    if (!w) continue;
    if (e.type === "combat") {
      bump(node.id, "combat", w * (1 + ((e.attLosses || 0) + (e.defLosses || 0)) / 8));
      if (RESOURCE_KINDS.has(node.kind)) bump(node.id, "attrition", w * 0.5);
    } else if (e.type === "capture") {
      bump(node.id, "attrition", w * (RESOURCE_KINDS.has(node.kind) ? 1.4 : 0.7));
    }
  }

  // Traffic — columns in the field and the routes they are marching
  for (const c of columns) {
    const weight = 0.6 + Math.min(c.strength || 0, 40) / 40;
    if (c.nodeId) bump(c.nodeId, "traffic", weight);
    for (const nid of c.march?.path || []) bump(nid, "traffic", weight * 0.5);
  }
  for (const mp of marchPaths) for (const nid of mp.path || []) bump(nid, "traffic", 0.4);

  const rows = Object.entries(acc).map(([id, a]) => {
    const node = nodes.find((n) => n.id === id);
    const raw = a.combat * 1.6 + a.attrition * 1.2 + a.traffic * 0.8;
    const dominant = a.combat >= a.attrition && a.combat >= a.traffic ? "combat"
      : a.attrition >= a.traffic ? "attrition" : "traffic";
    return { id, node, ...a, raw, dominant };
  }).filter((r) => r.node && r.raw > 0);

  const peak = Math.max(...rows.map((r) => r.raw), 1);
  return rows
    .map((r) => ({ ...r, heat: Math.min(r.raw / peak, 1) }))
    .sort((a, b) => b.heat - a.heat);
}

export const DOMINANT_META = {
  combat: { label: "Heavy Contact", color: "#C2503C" },
  attrition: { label: "Stores Draining", color: "#C9A227" },
  traffic: { label: "Column Traffic", color: "#7A93A5" },
};