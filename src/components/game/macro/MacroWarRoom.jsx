import React, { useMemo, useState } from "react";
import { Flag, Ban, Crosshair, Hammer, Swords, Home } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { UNIT_MARCH } from "@/lib/macro/march";
import { playSfx } from "@/lib/sfx";
import MinistryChart from "@/components/chart/MinistryChart";
import { Button } from "@/components/ui/button";

const MUSTER_KEYS = ["riflemen", "crawler", "artillery", "fighter"];

// The macro command surface: the ministry tactical chart with live control,
// columns and march plotting, driven entirely by fog-filtered server state.
export default function MacroWarRoom({ game, busy, onAction }) {
  const macro = game.macro;
  const worldSpec = WORLDS.find((w) => w.id === game.planetId);
  const world = useMemo(
    () => ({ nodes: macro.nodes, routes: macro.routes, continents: macro.continents || [], size: macro.size }),
    [macro.nodes, macro.routes, macro.continents, macro.size]
  );
  const byId = useMemo(() => Object.fromEntries(macro.nodes.map((n) => [n.id, n])), [macro.nodes]);
  const slotColors = Object.fromEntries(game.factions.map((f) => [f.slotIndex, f.color]));
  const myColumns = macro.columns.filter((c) => c.owner === game.mySlot);
  const canOrder = game.isMyTurn && !busy;

  const [hovered, setHovered] = useState(null);
  const [menu, setMenu] = useState(null);          // node id with open orders menu
  const [plotting, setPlotting] = useState(null);  // columnId awaiting an objective
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [muster, setMuster] = useState(null);      // { nodeId, regiments, generalId }

  const myBase = macro.bases.find((b) => b.slot === game.mySlot);
  const suppliedSet = useMemo(() => new Set(macro.supplied || []), [macro.supplied]);
  const [movingBase, setMovingBase] = useState(false); // base awaiting a destination
  const musterSites = macro.nodes.filter(
    (n) => macro.control[n.id] === game.mySlot && (n.kind === "city" || myBase?.nodeId === n.id)
  );
  const freeGenerals = (game.myGenerals || []).filter(
    (g) => !myColumns.some((c) => c.general?.id === g.id)
  );

  const closeMenu = () => setMenu(null);
  const columnsAt = (nodeId) => myColumns.filter((c) => c.nodeId === nodeId);
  const hostilesAt = (nodeId) => macro.columns.filter((c) => c.owner !== game.mySlot && c.nodeId === nodeId);
  const routeBetween = (a, b) => macro.routes.find(([x, y]) => (x === a && y === b) || (x === b && y === a));

  const onNodeClick = (node) => {
    playSfx("select");
    if (movingBase) {
      onAction({ action: "macroMoveBase", toNodeId: node.id });
      playSfx("move");
      setMovingBase(false);
      return;
    }
    if (plotting) {
      onAction({ action: "macroPlotMarch", columnId: plotting, toNodeId: node.id });
      playSfx("move");
      setPlotting(null);
      setSelectedColumn(null);
      return;
    }
    setMenu((m) => (m === node.id ? null : node.id));
  };

  const menuOptionsFor = (node) => {
    const done = (fn, sound = "select") => () => { playSfx(sound); fn(); closeMenu(); };
    const opts = [];
    if (!canOrder) return opts;
    const here = columnsAt(node.id);
    for (const c of here.slice(0, 2)) {
      opts.push({ key: `march-${c.id}`, label: `March ${c.name}`, icon: Flag, act: done(() => { setPlotting(c.id); setSelectedColumn(c.id); }) });
    }
    // A foreign column in reach — order the assault from an adjacent staging node
    if (hostilesAt(node.id).length > 0) {
      const stagers = myColumns.filter((c) => c.nodeId && routeBetween(c.nodeId, node.id));
      for (const c of stagers.slice(0, 2)) {
        opts.push({ key: `assault-${c.id}`, label: `Assault with ${c.name}`, icon: Swords, tone: "rust", act: done(() => onAction({ action: "macroEngage", columnId: c.id, toNodeId: node.id }), "attack") });
      }
    }
    if (musterSites.some((n) => n.id === node.id)) {
      opts.push({ key: "muster", label: "Muster Column", icon: Hammer, act: done(() => setMuster({ nodeId: node.id, regiments: { riflemen: 1 }, generalId: freeGenerals[0]?.id || "recruit" })) });
    }
    if (myBase?.nodeId && myBase.nodeId !== node.id) {
      opts.push({ key: "movebase", label: "March Fortress-Base Here", icon: Home, act: done(() => onAction({ action: "macroMoveBase", toNodeId: node.id }), "move") });
    }
    for (const c of here.slice(0, 1)) {
      opts.push({ key: `disband-${c.id}`, label: `Disband ${c.name}`, icon: Ban, tone: "rust", act: done(() => onAction({ action: "macroDisbandColumn", columnId: c.id })) });
    }
    return opts;
  };

  const marchPaths = [
    ...myColumns.filter((c) => c.march?.path?.length > 1).map((c) => ({ id: `col-${c.id}`, path: c.march.path, color: "#E8C15A" })),
    ...(myBase?.march?.path?.length > 1 ? [{ id: "base", path: myBase.march.path, color: "#C2503C", dashed: true }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="cq-panel cq-brackets relative overflow-hidden p-1">
        <div className="cq-hazard absolute top-0 left-0 right-0 z-10" />
        <MinistryChart
          world={world}
          palette={worldSpec?.palette}
          control={macro.control}
          slotColors={slotColors}
          observed={macro.observed}
          columns={macro.columns}
          bases={macro.bases}
          marchPaths={marchPaths}
          mySlot={game.mySlot}
          hovered={hovered}
          onHoverNode={setHovered}
          onNodeClick={onNodeClick}
          onColumnClick={(col) => setSelectedColumn(col.id === selectedColumn ? null : col.id)}
          selectedColumnId={selectedColumn}
          menuNodeId={menu}
          menuOptions={menu ? menuOptionsFor(byId[menu]) : null}
          onCloseMenu={closeMenu}
          height="64vh"
        />
        <div className="cq-scanlines absolute inset-0 pointer-events-none z-[5]" />
        <div className="cq-vignette absolute inset-0 pointer-events-none z-[5]" />
        {plotting && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 cq-panel px-3 py-1.5 bg-card/95 border-brass/70">
            <p className="font-mono text-[10px] text-brass-bright tracking-widest flex items-center gap-2">
              <Crosshair className="w-3 h-3" /> SELECT AN OBJECTIVE — THE COLUMN MARCHES AT DAWN
              <button onClick={() => setPlotting(null)} className="text-rust hover:text-brass-bright ml-2">CANCEL</button>
            </p>
          </div>
        )}
        {movingBase && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 cq-panel px-3 py-1.5 bg-card/95 border-rust/70">
            <p className="font-mono text-[10px] text-rust tracking-widest flex items-center gap-2">
              <Home className="w-3 h-3" /> SELECT GROUND FOR THE FORTRESS-BASE — IT ROLLS SLOWLY (LAND ROUTES ONLY)
              <button onClick={() => setMovingBase(false)} className="text-brass-bright hover:text-rust ml-2">CANCEL</button>
            </p>
          </div>
        )}
        <div className="absolute bottom-3 left-3 z-10 cq-panel p-2.5 bg-card/90 max-w-xs">
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
            DAY {game.turnNumber} · SETTLED WORLD {macro.settlementCount} SITES · CONTROL {game.myLandControl}% / {game.mapControlTarget}%
          </p>
          {hovered && (
            <p className="font-mono text-[9px] text-brass-bright mt-1 border-t border-border pt-1">
              ▸ {hovered.name.toUpperCase()}
              {macro.control[hovered.id] !== undefined && macro.control[hovered.id] !== null
                ? ` — HELD BY ${game.factions[macro.control[hovered.id]]?.factionName?.toUpperCase() || "?"}`
                : macro.observed.includes(hovered.id) ? " — UNCLAIMED" : " — NO RECENT INTELLIGENCE"}
              {suppliedSet.has(hovered.id) && <span className="text-olive"> · IN SUPPLY</span>}
            </p>
          )}
          <p className="font-mono text-[9px] text-muted-foreground mt-1 border-t border-border pt-1">
            ⌂ FORTRESS-BASE {myBase?.march ? "ON THE MOVE — ROLLING" : myBase?.nodeId ? `ANCHORED AT ${byId[myBase.nodeId]?.name?.toUpperCase() || "?"}` : "—"}
            {canOrder && myBase?.nodeId && (
              <button onClick={() => { playSfx("select"); setMovingBase(true); closeMenu(); }} className="text-rust hover:text-brass-bright ml-2">MARCH ▸</button>
            )}
          </p>
        </div>
        <div className="absolute bottom-3 right-3 z-10 cq-panel p-2 bg-card/90 font-mono text-[9px] text-muted-foreground space-y-0.5">
          {[["highway", "#C9A227"], ["road", "#9a927f"], ["track", "#6e675c"], ["trail", "#5a5348"], ["convoy lane", "#7A93A5"]].map(([q, c]) => (
            <div key={q} className="flex items-center gap-2">
              <span className="inline-block w-5 h-0.5" style={{ background: c }} />
              {q.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Order of march */}
      <div className="cq-panel p-4">
        <p className="cq-label mb-2">Order of March</p>
        {myColumns.length === 0 && <p className="font-mono text-[10px] text-muted-foreground">NO COLUMNS IN THE FIELD — MUSTER AT A CITY OR THE FORTRESS-BASE.</p>}
        <div className="space-y-1.5">
          {myColumns.map((c) => (
            <div key={c.id} className={`flex items-center gap-2 border rounded-sm p-2 text-xs ${selectedColumn === c.id ? "border-brass/70 bg-brass/10" : "border-border bg-secondary/30"}`}>
              <span className="font-heading tracking-wide text-secondary-foreground">{c.name}</span>
              <span className="font-mono text-[9px] text-muted-foreground">
                {c.general ? c.general.name : "—"} · {c.strength}PT · {c.dayRate ? `${c.dayRate} MI/DAY` : "NO GROUND ELEMENTS"}
                {c.inSupply === false && <span className="text-rust"> · CUT OFF</span>}
              </span>
              <span className="font-mono text-[9px] text-brass ml-auto">
                {c.nodeId ? `AT ${byId[c.nodeId]?.name?.toUpperCase() || "?"}` : `→ ${byId[c.march.path[c.march.path.length - 1]]?.name?.toUpperCase() || "?"}`}
              </span>
              {canOrder && (
                <button
                  title={c.posture === "evasive" ? "Evasive — slips past enemies on the road when it can" : "Aggressive — runs down enemies caught on the same road"}
                  onClick={() => { playSfx("hover"); onAction({ action: "macroSetPosture", columnId: c.id, posture: c.posture === "evasive" ? "aggressive" : "evasive" }); }}
                  className={`h-6 px-2 text-[9px] rounded-sm border font-heading uppercase tracking-wide transition-colors ${c.posture === "evasive" ? "border-steel/60 text-steel" : "border-rust/50 text-rust"}`}
                >
                  {c.posture === "evasive" ? "Evasive" : "Aggressive"}
                </button>
              )}
              {canOrder && c.nodeId && (
                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-brass/50 text-brass-bright font-heading uppercase" onClick={() => { playSfx("select"); setPlotting(c.id); setSelectedColumn(c.id); }}>
                  March
                </Button>
              )}
              {canOrder && c.march && (
                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-rust/50 text-rust font-heading uppercase" onClick={() => { playSfx("select"); onAction({ action: "macroHalt", columnId: c.id }); }}>
                  Halt
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Muster form */}
      {muster && (
        <div className="cq-panel p-4 border-brass/50">
          <p className="cq-label mb-2">Muster at {byId[muster.nodeId]?.name}</p>
          <div className="flex flex-wrap gap-3 items-end">
            {MUSTER_KEYS.map((k) => (
              <div key={k}>
                <p className="font-mono text-[9px] text-muted-foreground tracking-widest">{(UNIT_MARCH[k]?.label || k).toUpperCase()}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <button onClick={() => setMuster((m) => ({ ...m, regiments: { ...m.regiments, [k]: Math.max((m.regiments[k] || 0) - 1, 0) } }))} className="cq-metal w-5 h-5 rounded-sm border border-border text-muted-foreground leading-none">−</button>
                  <span className="font-mono w-5 text-center text-foreground text-xs">{muster.regiments[k] || 0}</span>
                  <button onClick={() => setMuster((m) => ({ ...m, regiments: { ...m.regiments, [k]: (m.regiments[k] || 0) + 1 } }))} className="cq-metal w-5 h-5 rounded-sm border border-border text-muted-foreground leading-none">+</button>
                </div>
              </div>
            ))}
            <div>
              <p className="font-mono text-[9px] text-muted-foreground tracking-widest">COMMANDER</p>
              <select
                value={muster.generalId}
                onChange={(e) => setMuster((m) => ({ ...m, generalId: e.target.value }))}
                className="bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide mt-0.5"
              >
                {freeGenerals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                <option value="recruit">Commission new (4 MP)</option>
              </select>
            </div>
            <Button
              size="sm"
              disabled={busy}
              className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-widest"
              onClick={() => { playSfx("build"); onAction({ action: "macroMusterColumn", ...muster }); setMuster(null); }}
            >
              Levy Column
            </Button>
            <Button size="sm" variant="outline" className="border-border text-muted-foreground font-heading uppercase text-xs" onClick={() => setMuster(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
