// ---------------------------------------------------------------------------
// The radial command tree.
//
// Every counter is a radial button. What its tree contains depends entirely on
// the situation at the moment it is opened:
//
//   your unit, your turn      — the full order tree, branch by branch
//   your unit, not your turn  — its own file only (no orders may be issued)
//   hostile / neutral unit    — the intel tree, at whatever fidelity you've earned
//   hostile, your turn, in contact — engagement orders ON TOP of the intel tree
//
// Nodes are one of: a branch (`children`), an order (`act` = activity key), or
// an intel pull (`report` = report kind).
// ---------------------------------------------------------------------------
import {
  Crosshair, Flame, Bomb, Zap, Move, Shovel, Hammer, Wrench, Package, Eye,
  Flag, Shield, Radio, FileText, Search, Gauge, Swords, Layers, Wind,
} from "lucide-react";
import { UNIT_TYPES, FIRE_ACT, MOVE_ACT, CARRIES_FUEL } from "./orbat";

const N = (key, label, icon, extra) => ({ key, label, icon, ...extra });

// The intel branch — always available on any counter, friend or foe.
const intelBranch = (label = "Intelligence") =>
  N("intel", label, FileText, {
    tone: "steel",
    children: [
      N("r_identity", "Identify", Search, { report: "identity", tone: "steel" }),
      N("r_strength", "Strength", Gauge, { report: "strength", tone: "steel" }),
      N("r_signals", "Signals", Radio, { report: "signals", tone: "steel" }),
      N("r_ground", "Ground", Layers, { report: "ground", tone: "steel" }),
    ],
  });

function fireBranch(stand) {
  const t = UNIT_TYPES[stand.type];
  const dry = stand.ammo <= 0;
  const kids = [N("f_primary", "Open Fire", Crosshair, { act: FIRE_ACT[stand.type], tone: "rust", disabled: dry })];

  if (t.arm === "inf" || t.arm === "recon")
    kids.push(N("f_sustained", "Sustained", Zap, { act: "firing_sustained", tone: "rust", disabled: dry }));
  if (t.arm === "inf") kids.push(N("f_grenade", "Grenades", Bomb, { act: "grenade", tone: "rust", disabled: dry }));
  if (stand.type === "flame_team") kids.push(N("f_flame", "Flame", Flame, { act: "flame", tone: "rust", disabled: dry }));
  if (t.arm === "gun") {
    kids.push(N("f_barrage", "Barrage", Bomb, { act: "firing_siege", tone: "rust", disabled: dry }));
    // Fume fillings go around plate at the crew — the answer to dug-in armour.
    kids.push(N("f_gas", "Gas Shells", Wind, { act: "firing_gas", tone: "rust", disabled: dry }));
  }

  return N("fire", "Fire", Crosshair, { tone: "rust", children: kids });
}

function moveBranch(stand) {
  const act = MOVE_ACT[UNIT_TYPES[stand.type].arm];
  const spent = !!stand.moved;
  return N("move", "Movement", Move, {
    children: [
      N("m_advance", "Advance", Move, { act, disabled: spent }),
      N("m_withdraw", "Withdraw", Shield, { act, disabled: spent }),
      N("m_redeploy", "Redeploy", Flag, { act, disabled: spent }),
    ],
  });
}

function worksBranch(stand) {
  const t = UNIT_TYPES[stand.type];
  const kids = [
    N("w_dig", "Dig In", Shovel, { act: "digging" }),
    N("w_works", "Field Works", Hammer, { act: "constructing" }),
    N("w_resupply", "Resupply", Package, { act: "reloading" }),
  ];
  if (CARRIES_FUEL.includes(t.arm)) kids.push(N("w_repair", "Repair", Wrench, { act: "repairing" }));
  return N("works", "Works", Hammer, { children: kids });
}

const supportBranch = () =>
  N("support", "Support", Eye, {
    children: [
      N("s_observe", "Observe", Eye, { act: "spotting" }),
      N("s_rally", "Rally", Flag, { act: "rally" }),
    ],
  });

/**
 * Build the root ring for a stand.
 * ctx: { own, yourTurn, inContact, arm }
 */
export function buildUnitTree(stand, ctx) {
  const t = UNIT_TYPES[stand.type];

  // Your own counter, on your own turn — the full order tree.
  if (ctx.own && ctx.yourTurn) {
    return [fireBranch(stand), moveBranch(stand), worksBranch(stand), supportBranch(), intelBranch("File")];
  }

  // Your own counter, but the hour belongs to the other side.
  if (ctx.own) {
    return [intelBranch("File"), N("held", "Orders Held", Shield, { tone: "steel", disabled: true })];
  }

  // A hostile or neutral counter. Intel always; engagement only in contact on
  // your own turn.
  const nodes = [intelBranch("Intelligence")];
  if (ctx.yourTurn && ctx.inContact) {
    nodes.unshift(
      N("engage", "Engage", Swords, {
        tone: "rust",
        children: [
          N("e_assault", "Assault", Swords, { act: "melee", tone: "rust" }),
          N("e_fire", "Fire On", Crosshair, { act: "designate", tone: "rust" }),
        ],
      }),
    );
  }
  if (ctx.yourTurn && !ctx.inContact && t.arm !== "recon") {
    nodes.unshift(N("mark", "Mark Target", Crosshair, { tone: "rust", act: "designate" }));
  }
  return nodes;
}

// Walk a path of node keys down the tree to the ring currently on screen.
export function resolvePath(root, path) {
  let ring = root;
  const trail = [];
  for (const key of path) {
    const node = ring.find((n) => n.key === key);
    if (!node?.children) break;
    trail.push(node.label);
    ring = node.children;
  }
  return { ring, trail };
}