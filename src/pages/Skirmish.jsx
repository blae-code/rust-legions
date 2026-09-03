import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { SCENARIOS, scenarioById } from "@/lib/skirmish/scenarios";
import { costOf, newUid, buildAiForce, seedFromDesign } from "@/lib/skirmish/roster";
import { saveSkirmish } from "@/lib/skirmish/session";
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
            <Panel step="03" title="Opposing Command">
              <OpponentPanel doctrine={doctrine} onDoctrine={setDoctrine} />
            </Panel>
          </div>

          <Panel step="04" title="Force Requisition">
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
            canLaunch={items.length >= 3}
            onLaunch={launch}
          />
        </aside>
      </div>
    </div>
  );
}