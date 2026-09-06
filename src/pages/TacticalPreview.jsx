import React, { useMemo, useState } from "react";
import { generateField, PALETTES } from "@/lib/tactical/field";
import { SAMPLE_ORBAT, neighborsOf, FIRE_ACT } from "@/lib/tactical/orbat";
import useActivities from "@/hooks/useActivities";
import OrderRail from "@/components/tactical/hud/OrderRail";
import { buildUnitTree, resolvePath } from "@/lib/tactical/unitOrders";
import { assess, buildReport } from "@/lib/tactical/intel";
import IntelSlip from "@/components/tactical/radial/IntelSlip";
import SideToggles from "@/components/tactical/hud/SideToggles";
import BattlefieldBoard from "@/components/tactical/BattlefieldBoard";
import BoardViewport from "@/components/tactical/BoardViewport";
import FieldControls from "@/components/tactical/FieldControls";
import TileInspector from "@/components/tactical/TileInspector";
import CommandBar from "@/components/tactical/hud/CommandBar";
import StandPanel from "@/components/tactical/hud/StandPanel";
import SignalsLog from "@/components/tactical/hud/SignalsLog";
import OrbatList from "@/components/tactical/hud/OrbatList";
import InitiativeTracker from "@/components/tactical/hud/InitiativeTracker";
import BuildProgress from "@/components/tactical/BuildProgress";
import { readSkirmish, saveSkirmish, clearSkirmish } from "@/lib/skirmish/session";
import { deployForces, strip } from "@/lib/skirmish/deploy";
import BattleBanner from "@/components/skirmish/BattleBanner";
import DeploymentRack from "@/components/skirmish/DeploymentRack";

// The tactical arena as a hex-wargame command surface: counters on painted
// ground, an assault forecast on every contact, and service cards on the rail.
export default function TacticalPreview() {
  // A requisitioned skirmish takes over the arena: its ground, its forces.
  const [order, setOrder] = useState(() => readSkirmish());
  // Deployment: the order is fought only once its stands have been set down.
  const deploying = !!order && !order.placements;
  const [placements, setPlacements] = useState({});
  const [carry, setCarry] = useState(null);
  const [opts, setOpts] = useState(
    order ? order.opts : { seed: 20260903, nodeKind: "town", weather: "clear", fortBonus: 2 },
  );
  const [hover, setHover] = useState(null);
  const [selectedId, setSelectedId] = useState(order ? null : "a4");
  const [targetId, setTargetId] = useState(order ? null : "d1");
  const [tab, setTab] = useState("Orders");
  const [menu, setMenu] = useState(null); // { standId, path: [] } — the open radial
  const [intel, setIntel] = useState(null); // { standId, kind } — the pulled file
  const [zoom, setZoom] = useState(1);
  const [viewSide, setViewSide] = useState(order ? order.side : "attacker");
  const [turnSide, setTurnSide] = useState(order ? order.side : "attacker");
  const { acts, issue } = useActivities();

  const field = useMemo(() => generateField(opts), [opts]);
  const palette = PALETTES[field.meta.nodeKind];

  // Either the requisitioned forces, deployed into their strips, or the
  // standing sample engagement when the arena is opened on its own.
  const deployed = useMemo(() => (order ? deployForces(field, order) : SAMPLE_ORBAT), [order, field]);
  // In a co-op skirmish each commander orders only the stands they bought.
  const commands = (s) => !order?.me || !s.owner || s.owner === order.me;
  // The rack: the stands this commander must set down before the battle opens.
  const rack = useMemo(
    () => (deploying ? deployed.filter((s) => s.side === order.side && commands(s)) : []),
    [deploying, deployed, order],
  );
  // While deploying only your own side is on the sheet, and only what has been placed.
  const orbat = useMemo(() => {
    if (!deploying) return deployed;
    return deployed
      .filter((s) => s.side === order.side)
      .flatMap((s) => (commands(s) ? (placements[s.id] ? [{ ...s, ...placements[s.id] }] : []) : [s]));
  }, [deploying, deployed, order, placements]);

  // Your strip, lit for placing — hexes already holding a stand are marked taken.
  const pickHexes = useMemo(() => {
    if (!deploying) return null;
    const taken = new Set(orbat.map((s) => `${s.q},${s.r}`));
    const carried = carry && placements[carry] ? `${placements[carry].q},${placements[carry].r}` : null;
    return strip(field, order.side).map((h) => {
      const k = `${h.q},${h.r}`;
      return { q: h.q, r: h.r, taken: taken.has(k) && k !== carried };
    });
  }, [deploying, orbat, field, order, carry, placements]);

  const placeAt = (h) => {
    if (!carry) return;
    setPlacements((p) => ({ ...p, [carry]: { q: h.q, r: h.r } }));
    setCarry(null);
  };
  // Whatever is still in reserve takes its surveyed slot, skipping occupied hexes.
  const autoPlace = () => {
    const taken = new Set(Object.values(placements).map((p) => `${p.q},${p.r}`));
    for (const s of deployed) if (s.side === order.side && !commands(s)) taken.add(`${s.q},${s.r}`);
    const free = strip(field, order.side).filter((h) => !taken.has(`${h.q},${h.r}`));
    const pending = rack.filter((s) => !placements[s.id]);
    // Every other hex when the strip has room, shoulder to shoulder when it does not.
    const slots = pending.length * 2 <= free.length ? free.filter((_, i) => i % 2 === 0) : free;
    const next = { ...placements };
    pending.forEach((s, i) => {
      const h = slots[i];
      if (h) next[s.id] = { q: h.q, r: h.r };
    });
    setPlacements(next);
  };
  const commence = () => {
    const fielded = { ...order, placements };
    saveSkirmish(fielded);
    setOrder(fielded);
    setCarry(null);
  };

  // Counters are static; their current activity is layered on at render time.
  const stands = useMemo(
    () => orbat.map((s) => (acts[s.id] ? { ...s, activity: acts[s.id] } : s)),
    [orbat, acts],
  );

  const selected = stands.find((s) => s.id === selectedId) || null;
  const target = stands.find((s) => s.id === targetId) || null;

  const coverAt = (s) => field.tiles[`${s.q},${s.r}`]?.cover || 0;
  const contactWith = (stand) =>
    stands.some(
      (v) => v.side === viewSide && neighborsOf(v.q, v.r).some((n) => n.q === stand.q && n.r === stand.r),
    );

  // Every counter is a radial button: opening one selects it (or marks it, if
  // it belongs to the other side) and fans out whatever it can offer right now.
  const handleSelect = (stand) => {
    // During deployment a click on your own placed counter picks it back up.
    if (deploying) {
      if (commands(stand)) setCarry(stand.id);
      return;
    }
    if (stand.side === viewSide) setSelectedId(stand.id);
    else setTargetId(stand.id);
    setIntel(null);
    setMenu({ standId: stand.id, path: [] });
  };

  // Picking a portrait in the queue jumps to that counter and selects it —
  // marking it instead if it belongs to the other side.
  const jumpTo = (stand) => {
    if (stand.side === viewSide) setSelectedId(stand.id);
    else setTargetId(stand.id);
    setMenu(null);
    setIntel(null);
  };

  // The tree for the open counter, resolved to the ring currently on screen.
  const menuStand = stands.find((s) => s.id === menu?.standId) || null;
  const radial = useMemo(() => {
    if (!menuStand) return null;
    const own = menuStand.side === viewSide;
    const ally = own && !commands(menuStand);
    const yourTurn = viewSide === turnSide;
    const root = buildUnitTree(menuStand, { own, ally, yourTurn, inContact: contactWith(menuStand) });
    const { ring, trail } = resolvePath(root, menu.path);
    return {
      stand: menuStand,
      ring,
      trail,
      note: ally ? `${menuStand.owner}'s stand` : own ? (yourTurn ? null : "Orders held") : "Hostile",
      onPick: (node) => {
        if (node.children) return setMenu((m) => ({ ...m, path: [...m.path, node.key] }));
        if (node.report) {
          setIntel({ standId: menuStand.id, kind: node.report });
          return setMenu(null);
        }
        if (node.act === "designate") {
          setTargetId(menuStand.id);
          if (selected) issue(selected.id, FIRE_ACT[selected.type]);
          issue(menuStand.id, "suppressed");
          return setMenu(null);
        }
        if (node.act) issue(menuStand.id, node.act);
        setMenu(null);
      },
      onBack: () => setMenu((m) => ({ ...m, path: m.path.slice(0, -1) })),
      onClose: () => setMenu(null),
    };
  }, [menuStand, menu, viewSide, turnSide, stands, selected, targetId, issue, field]);

  // The intel file, printed at whatever fidelity the viewer's own units earn.
  const intelStand = stands.find((s) => s.id === intel?.standId) || null;
  const intelView = useMemo(() => {
    if (!intelStand) return null;
    const obs = assess(intelStand, stands.filter((s) => s.side === viewSide), field.meta.weather);
    return { obs, report: buildReport(intel.kind, intelStand, obs, coverAt(intelStand)) };
  }, [intelStand, intel, stands, viewSide, field]);

  return (
    <div className="cq-page-in max-w-[1800px] mx-auto px-3 py-3 space-y-2">
      {order && <BattleBanner order={order} onStand={clearSkirmish} />}

      <CommandBar field={field} tab={tab} onTab={setTab} turn={7} />

      <div className="sticky top-2 z-30">
        <InitiativeTracker
          stands={stands}
          field={field}
          viewSide={viewSide}
          selectedId={selectedId}
          onPick={jumpTo}
        />
      </div>

      <div className="grid xl:grid-cols-[1fr_296px] gap-2 items-start">
        <div className="cq-panel cq-brackets p-2 cq-board relative overflow-hidden">
          <BoardViewport zoom={zoom} onZoom={setZoom}>
            <BattlefieldBoard
              field={field}
              stands={stands}
              selectedId={selectedId}
              targetId={targetId}
              onSelectStand={handleSelect}
              onClearSelection={() => setMenu(null)}
              onHoverTile={setHover}
              radial={deploying ? null : radial}
              zoom={zoom}
              pickHexes={pickHexes}
              onPickHex={placeAt}
            />
          </BoardViewport>
          {field.meta.weather === "rain" && <div className="absolute inset-0 cq-rain" />}
          {field.meta.weather === "snow" && <div className="absolute inset-0 cq-snowfall" />}
          {field.meta.weather === "fog" && <div className="absolute inset-0 cq-fogbank" />}
          {field.meta.weather === "storm" && (
            <>
              <div className="absolute inset-0 cq-rain" />
              <div className="absolute inset-0 cq-stormflash bg-slate-200" />
            </>
          )}
          <div className="absolute top-2 left-2 cq-slip px-2 py-1 pointer-events-none">
            <p className="font-mono text-[9px] tracking-widest text-brass-bright">
              {palette.label.toUpperCase()} · {field.w}×{field.h}
            </p>
          </div>

          <div className="absolute top-2 right-2">
            <SideToggles
              viewSide={viewSide}
              turnSide={turnSide}
              onView={(s) => { setViewSide(s); setMenu(null); setIntel(null); }}
              onTurn={setTurnSide}
            />
          </div>

          {intelView && (
            <div className="absolute bottom-2 right-2">
              <IntelSlip
                standName={
                  intelStand.side === viewSide || intelView.obs.level === "confirmed"
                    ? intelStand.name
                    : `Contact ${intelStand.q},${intelStand.r}`
                }
                report={intelView.report}
                obs={intelView.obs}
                onClose={() => setIntel(null)}
              />
            </div>
          )}
        </div>

        <aside className="space-y-2">
          {deploying && (
            <DeploymentRack
              stands={rack}
              placements={placements}
              carry={carry}
              onCarry={setCarry}
              onAuto={autoPlace}
              onCommence={commence}
            />
          )}

          {!deploying && tab === "Orders" && (
            <div className="cq-panel p-2.5">
              <p className="cq-label text-rust mb-2">Issue Orders</p>
              <OrderRail
                stand={selected}
                current={selected && acts[selected.id]}
                onIssue={issue}
                locked={!!selected && !commands(selected)}
              />
            </div>
          )}

          {tab === "Order of Battle" && (
            <div className="cq-panel p-2.5">
              <OrbatList stands={stands} selectedId={selectedId} onSelect={handleSelect} />
            </div>
          )}

          {tab === "Signals" && (
            <div className="cq-panel p-2.5">
              <p className="cq-label text-rust mb-2">Signals Intercept</p>
              <SignalsLog />
            </div>
          )}

          {tab === "Survey" && (
            <>
              <div className="cq-panel p-2.5">
                <p className="cq-label text-rust mb-2.5">Survey Orders</p>
                <FieldControls opts={opts} onChange={(patch) => setOpts((o) => ({ ...o, ...patch }))} />
              </div>
              <div className="cq-slip p-2.5">
                <TileInspector tile={hover} />
              </div>
              <BuildProgress />
            </>
          )}
        </aside>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <StandPanel stand={selected} role="selected" />
        <StandPanel stand={target} role="target" />
      </div>
    </div>
  );
}