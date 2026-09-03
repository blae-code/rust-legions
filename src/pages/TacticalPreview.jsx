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
import { readSkirmish, clearSkirmish } from "@/lib/skirmish/session";
import { deployForces } from "@/lib/skirmish/deploy";
import BattleBanner from "@/components/skirmish/BattleBanner";

// The tactical arena as a hex-wargame command surface: counters on painted
// ground, an assault forecast on every contact, and service cards on the rail.
export default function TacticalPreview() {
  // A requisitioned skirmish takes over the arena: its ground, its forces.
  const order = useMemo(() => readSkirmish(), []);
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
  const orbat = useMemo(() => (order ? deployForces(field, order) : SAMPLE_ORBAT), [order, field]);

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
    const yourTurn = viewSide === turnSide;
    const root = buildUnitTree(menuStand, { own, yourTurn, inContact: contactWith(menuStand) });
    const { ring, trail } = resolvePath(root, menu.path);
    return {
      stand: menuStand,
      ring,
      trail,
      note: own ? (yourTurn ? null : "Orders held") : "Hostile",
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
              radial={radial}
              zoom={zoom}
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
          {tab === "Orders" && (
            <div className="cq-panel p-2.5">
              <p className="cq-label text-rust mb-2">Issue Orders</p>
              <OrderRail stand={selected} current={selected && acts[selected.id]} onIssue={issue} />
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