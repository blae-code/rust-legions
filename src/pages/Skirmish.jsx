import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SCENARIOS, scenarioById } from "@/lib/skirmish/scenarios";
import { costOf, newUid, buildAiForce, seedFromDesign } from "@/lib/skirmish/roster";
import { saveSkirmish } from "@/lib/skirmish/session";
import { makeCode } from "@/lib/skirmish/lobby";
import useUser from "@/hooks/useUser";
import useCallsign from "@/hooks/useCallsign";
import MusterChoice from "@/components/skirmish/MusterChoice";
import ScenarioCard from "@/components/skirmish/ScenarioCard";
import SideChoice from "@/components/skirmish/SideChoice";
import OpponentPanel from "@/components/skirmish/OpponentPanel";
import DesignSeedPicker from "@/components/skirmish/DesignSeedPicker";
import RosterShop from "@/components/skirmish/RosterShop";
import ForceSlip from "@/components/skirmish/ForceSlip";
import LaunchOrder from "@/components/skirmish/LaunchOrder";

const Panel = ({ step, title, children }) => (
  <div className="cq-panel p-3.5">
    <div className="flex items-center gap-2.5 mb-2.5">
      <span className="flex items-center justify-center w-7 h-7 rounded-sm border border-brass/50 bg-brass/10 font-display text-sm text-brass-bright">
        {step}
      </span>
      <p className="cq-label text-foreground/90">{title}</p>
    </div>
    {children}
  </div>
);

// A single set-piece engagement, requisitioned on one sheet: pick the ground,
// pick your end of it, buy a force to the allowance, and take the field.
export default function Skirmish() {
  const navigate = useNavigate();
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [side, setSide] = useState("attacker");
  const [doctrine, setDoctrine] = useState("aggressive");
  const [items, setItems] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [mode, setMode] = useState("solo");
  const [joinError, setJoinError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { user } = useUser();
  const callsign = useCallsign();

  const scenario = scenarioById(scenarioId);
  const spent = useMemo(() => costOf(items), [items]);
  const left = scenario.points - spent;

  useEffect(() => {
    base44.entities.ArmyDesign.list("-created_date", 20).then(setDesigns).catch(() => setDesigns([]));
  }, []);

  // A new sheet means a new allowance — the old force does not carry over.
  useEffect(() => setItems([]), [scenarioId]);

  const launch = () => {
    saveSkirmish({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      objective: scenario.objective,
      side,
      doctrine,
      opts: {
        seed: scenario.seed,
        nodeKind: scenario.nodeKind,
        weather: scenario.weather,
        fortBonus: scenario.fortBonus,
      },
      force: items.map((it) => ({ type: it.type })),
      enemyForce: buildAiForce(scenario.points, doctrine).map((it) => ({ type: it.type })),
    });
    navigate("/tactical-preview");
  };

  // Open a muster roll with this sheet, seated on the chosen side with whatever
  // has been bought so far; the rest is done in the lobby.
  const openLobby = async () => {
    setBusy(true);
    const lobby = await base44.entities.SkirmishLobby.create({
      name: scenario.name,
      code: makeCode(),
      hostUserId: user.id,
      hostCallsign: callsign || "Commander",
      scenarioId: scenario.id,
      doctrine,
      status: "mustering",
      seats: [{ userId: user.id, callsign: callsign || "Commander", side, force: items.map(({ key, type }) => ({ key, type })), ready: false }],
    });
    navigate(`/skirmish/lobby/${lobby.id}`);
  };

  const joinByCode = async (code) => {
    setBusy(true);
    setJoinError(null);
    const found = await base44.entities.SkirmishLobby.filter({ code, status: "mustering" });
    if (found[0]) return navigate(`/skirmish/lobby/${found[0].id}`);
    setJoinError("NO OPEN MUSTER UNDER THAT CODE");
    setBusy(false);
  };

  return (
    <div className="cq-page-in space-y-4">
      <div className="cq-panel p-4">
        <div className="cq-hazard mb-3 -mt-1 -mx-1" />
        <p className="cq-label text-rust">Ministry of War · Form 9-S</p>
        <h1 className="cq-display text-3xl mt-1">Skirmish Requisition</h1>
        <p className="text-sm text-secondary-foreground/80 mt-1 max-w-2xl">
          One battle, one force, no campaign. Draw a filed scenario, spend the allowance, and fight it out on
          the ground as surveyed.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4">
          <Panel step="01" title="Scenario Drawer">
            <div className="grid md:grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} scenario={s} active={s.id === scenarioId} onPick={setScenarioId} />
              ))}
            </div>
          </Panel>

          <div className="grid md:grid-cols-2 gap-4">
            <Panel step="02" title="Your Role">
              <SideChoice value={side} onChange={setSide} />
            </Panel>
            <Panel step="03" title="Muster">
              <MusterChoice mode={mode} onMode={setMode} onJoin={joinByCode} joining={busy} />
              {joinError && (
                <p className="font-mono text-[9px] text-rust tracking-widest mt-1.5">{joinError}</p>
              )}
            </Panel>
          </div>

          <Panel step="04" title="Machine Command">
            <OpponentPanel doctrine={doctrine} onDoctrine={setDoctrine} />
          </Panel>

          <Panel step="05" title="Force Requisition">
            <div className="space-y-3">
              <div>
                <p className="cq-label mb-1.5">Start From A Saved Design</p>
                <DesignSeedPicker
                  designs={designs}
                  onSeed={(d) => setItems(seedFromDesign(d, scenario.points))}
                />
              </div>
              <div className="border-t border-border pt-3">
                <p className="cq-label mb-1.5">Requisition Roster</p>
                <RosterShop
                  left={left}
                  onBuy={(type) => setItems((prev) => [...prev, { key: newUid(), type }])}
                />
              </div>
            </div>
          </Panel>
        </div>

        <aside className="space-y-4">
          <div className="cq-panel p-3.5">
            <ForceSlip
              items={items}
              points={scenario.points}
              spent={spent}
              onRemove={(key) => setItems((prev) => prev.filter((it) => it.key !== key))}
              onClear={() => setItems([])}
            />
          </div>
          <LaunchOrder
            scenario={scenario}
            side={side}
            doctrine={doctrine}
            count={items.length}
            spent={spent}
            mode={mode}
            canLaunch={mode === "lobby" ? !busy && !!user : items.length >= 3}
            onLaunch={mode === "lobby" ? openLobby : launch}
          />
        </aside>
      </div>
    </div>
  );
}