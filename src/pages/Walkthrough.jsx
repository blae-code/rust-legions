import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StepFrame from "@/components/walkthrough/StepFrame";
import FortressDrill from "@/components/walkthrough/FortressDrill";
import TreadsPrimer from "@/components/walkthrough/TreadsPrimer";
import IdeologyDrill from "@/components/walkthrough/IdeologyDrill";

const TOTAL = 5;

// Field Induction — interactive recruit drill for fortress-bases and the ideology system
export default function Walkthrough() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [modules, setModules] = useState({});
  const [ideology, setIdeology] = useState({});

  const modulesReady = Object.values(modules).filter(Boolean).length >= 2;
  const ideologyReady = !!(ideology.doctrine && ideology.philosophy && ideology.value);

  const steps = [
    {
      title: "Field Induction", kicker: "Recruit Drill · War Ministry", canNext: true, nextLabel: "Begin Drill",
      body: (
        <div className="space-y-3 text-sm text-secondary-foreground font-body leading-relaxed">
          <p>
            Welcome to the front, Commander. This short drill covers the two systems every recruit must master
            before taking a banner to war: the <span className="text-brass-bright">mobile fortress-base</span> that
            anchors your faction, and the <span className="text-brass-bright">political ideology</span> that defines it.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest">DURATION: ~2 MINUTES · HANDS-ON · NOTHING YOU DO HERE AFFECTS A LIVE WAR</p>
        </div>
      ),
    },
    { title: "The Fortress-Base", kicker: "Drill I · Refit Bays", canNext: modulesReady, hint: "Fit at least two bays to pass the drill", body: <FortressDrill modules={modules} onChange={setModules} /> },
    { title: "The Great Treads", kicker: "Drill II · Marching Orders", canNext: true, body: <TreadsPrimer /> },
    { title: "Political Ideology", kicker: "Drill III · The State Creed", canNext: ideologyReady, hint: "Draft a full creed — doctrine, philosophy and values", body: <IdeologyDrill ideology={ideology} onChange={setIdeology} /> },
    {
      title: "Induction Complete", kicker: "Commission Granted", canNext: true, nextLabel: "Return to Command",
      body: (
        <div className="space-y-3">
          <p className="text-sm text-secondary-foreground font-body leading-relaxed">
            Drill passed, Commander. In a live war you will find the <span className="text-brass-bright">Refit Yard</span> on
            your Fortress-Base panel, and your ideology is forged for real in the Faction Foundry.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/faction-builder" className="cq-metal font-heading uppercase tracking-[0.2em] text-[10px] px-4 py-2 rounded-sm border border-brass/60 text-brass-bright hover:bg-brass/10 transition-colors">
              Forge a Faction
            </Link>
            <Link to="/new-game" className="cq-metal font-heading uppercase tracking-[0.2em] text-[10px] px-4 py-2 rounded-sm border border-border text-secondary-foreground hover:border-brass/60 transition-colors">
              Open a New Front
            </Link>
          </div>
        </div>
      ),
    },
  ];

  const s = steps[step];
  return (
    <div className="py-6">
      <StepFrame
        step={step} total={TOTAL} title={s.title} kicker={s.kicker}
        canNext={s.canNext} nextLabel={s.nextLabel} hint={s.hint}
        onBack={() => setStep(step - 1)}
        onNext={() => (step === TOTAL - 1 ? navigate("/") : setStep(step + 1))}
      >
        {s.body}
      </StepFrame>
    </div>
  );
}