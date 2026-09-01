import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Hammer } from "lucide-react";
import { LIFEPATH_CHAPTERS, availableOptions } from "@/lib/lifepath";
import { pickError } from "@/lib/pointBuy";
import { playSfx } from "@/lib/sfx";
import PointBuyPanel from "@/components/faction/PointBuyPanel";
import FoundryHeader from "@/components/faction/FoundryHeader";
import ChapterRegister from "@/components/faction/ChapterRegister";
import ChapterCard from "@/components/faction/ChapterCard";
import IdentityCard from "@/components/faction/IdentityCard";
import RegistrationFile from "@/components/faction/RegistrationFile";
import ReviewDossier from "@/components/faction/ReviewDossier";

// The registration file is kept on the desk — a reload or a stray navigation
// must never send a commander back to Chapter 1.
const DRAFT_KEY = "cq_lifepath_draft";
const readDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; }
};

const STEP_LABELS = [...LIFEPATH_CHAPTERS.map((c) => c.title), "Identity", "Armoury", "Review"];

export default function FactionBuilder() {
  const navigate = useNavigate();
  const saved = readDraft();
  const [step, setStep] = useState(saved.step || 0);
  const [choices, setChoices] = useState(saved.choices || {});
  const [identity, setIdentity] = useState(saved.identity || {});
  const [picks, setPicks] = useState(saved.picks || []);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isIdentityStep = step === LIFEPATH_CHAPTERS.length;
  const isArmouryStep = step === LIFEPATH_CHAPTERS.length + 1;
  const isReviewStep = step === LIFEPATH_CHAPTERS.length + 2;
  const chapter = LIFEPATH_CHAPTERS[step];

  useEffect(() => {
    // Never file the review step — synthesis is re-run on return
    const s = Math.min(step, LIFEPATH_CHAPTERS.length + 1);
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ step: s, choices, identity, picks }));
  }, [step, choices, identity, picks]);

  const synthesize = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("synthesizeFaction", {
        choices: { ...choices, ...identity },
        doctrine: identity.doctrine,
      });
      setResult(res.data);
      setStep(LIFEPATH_CHAPTERS.length + 2);
    } catch (e) {
      setError(e.response?.data?.error || "Synthesis failed — try again");
    }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Faction.create({
        factionName: result.factionName,
        lore: result.lore,
        doctrine: identity.doctrine,
        traits: result.traits,
        insigniaDescription: result.insigniaDescription,
        npcDispositions: result.npcDispositions,
        lifepathChoices: { ...choices, ...identity },
        pointBuy: { picks },
        isNPC: false,
      });
      localStorage.removeItem(DRAFT_KEY);
      playSfx("select");
      navigate("/");
    } catch {
      setError("Failed to save faction");
      setSaving(false);
    }
  };

  const nav = (back, next, nextDisabled, nextLabel = "Continue") => (
    <div className="flex justify-between mt-4">
      <Button variant="outline" disabled={back === null} onClick={() => { playSfx("select"); setStep(back); }} className="text-xs">
        Back
      </Button>
      <Button disabled={nextDisabled} onClick={next} className="text-xs">
        {nextLabel}
      </Button>
    </div>
  );

  return (
    <div className="max-w-3xl xl:max-w-6xl mx-auto space-y-4 cq-page-in">
      <FoundryHeader />
      <ChapterRegister labels={STEP_LABELS} step={step} onJump={(i) => { playSfx("select"); setStep(i); }} />

      <div className="grid xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div>
          {!isIdentityStep && !isArmouryStep && !isReviewStep && (
            <>
              <ChapterCard
                step={String(step + 1).padStart(2, "0")}
                title={chapter.title}
                prompt={chapter.prompt}
                options={availableOptions(chapter, choices)}
                value={choices[chapter.id]}
                onPick={(id) => setChoices({ ...choices, [chapter.id]: id })}
              />
              {nav(step === 0 ? null : step - 1, () => { playSfx("select"); setStep(step + 1); }, !choices[chapter.id])}
            </>
          )}

          {isIdentityStep && (
            <>
              <IdentityCard step={String(step + 1).padStart(2, "0")} identity={identity} setIdentity={setIdentity} />
              {error && <p className="font-mono text-[10px] text-rust mt-2">{error}</p>}
              {nav(step - 1, () => { playSfx("select"); setStep(step + 1); }, !identity.doctrine || !identity.philosophy || !identity.value)}
            </>
          )}

          {isArmouryStep && (
            <>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="cq-panel p-4 sm:p-5">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="flex items-center justify-center w-7 h-7 rounded-sm border border-brass/50 bg-brass/10 font-display text-sm text-brass-bright shrink-0">
                    {String(step + 1).padStart(2, "0")}
                  </span>
                  <label className="cq-label text-foreground/90">Requisition Bureau — Assets & Liabilities</label>
                </div>
                <p className="text-xs text-muted-foreground mb-4 ml-9">
                  Every asset and unit upgrade must be funded by accepting liabilities — the ledger cannot run a deficit. A blank ledger is a perfectly balanced nation.
                </p>
                <PointBuyPanel picks={picks} setPicks={setPicks} />
              </motion.div>
              {error && <p className="font-mono text-[10px] text-rust mt-2">{error}</p>}
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => { playSfx("select"); setStep(step - 1); }} className="text-xs">Back</Button>
                <Button variant="destructive" disabled={!!pickError(picks) || loading} onClick={synthesize} className="text-xs">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing history…</> : <><Hammer className="w-4 h-4" /> Forge the Nation</>}
                </Button>
              </div>
            </>
          )}

          {isReviewStep && result && (
            <ReviewDossier
              result={result}
              picks={picks}
              loading={loading}
              saving={saving}
              error={error}
              onRewrite={synthesize}
              onSave={save}
            />
          )}
        </div>

        <RegistrationFile choices={choices} identity={identity} picks={picks} factionName={result?.factionName} />
      </div>
    </div>
  );
}