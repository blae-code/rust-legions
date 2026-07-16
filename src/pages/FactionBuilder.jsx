import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { LIFEPATH_CHAPTERS, DOCTRINES, PHILOSOPHIES, VALUES, availableOptions } from "@/lib/lifepath";

const IDENTITY_GROUPS = [
  { key: "doctrine", title: "Military Doctrine", options: DOCTRINES },
  { key: "philosophy", title: "Economic Philosophy", options: PHILOSOPHIES },
  { key: "value", title: "Cultural Value", options: VALUES },
];

export default function FactionBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState({});
  const [identity, setIdentity] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isIdentityStep = step === LIFEPATH_CHAPTERS.length;
  const isReviewStep = step === LIFEPATH_CHAPTERS.length + 1;
  const chapter = LIFEPATH_CHAPTERS[step];

  const synthesize = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("synthesizeFaction", {
        choices: { ...choices, ...identity },
        doctrine: identity.doctrine,
      });
      setResult(res.data);
      setStep(LIFEPATH_CHAPTERS.length + 1);
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
        isNPC: false,
      });
      navigate("/");
    } catch (e) {
      setError("Failed to save faction");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-stone-100">Faction Lifepath</h1>
        <p className="text-sm text-stone-500">Your choices become your nation's history — synthesized into traits, lore, and standing with NPC powers.</p>
      </div>

      <div className="flex gap-1">
        {[...LIFEPATH_CHAPTERS.map((c) => c.title), "Identity", "Review"].map((t, i) => (
          <div key={t} className={`h-1 flex-1 rounded ${i <= step ? "bg-amber-700" : "bg-stone-800"}`} />
        ))}
      </div>

      {!isIdentityStep && !isReviewStep && (
        <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-6 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-700">Chapter {step + 1} — {chapter.title}</p>
            <h2 className="text-lg font-bold text-stone-100 mt-1">{chapter.prompt}</h2>
          </div>
          <div className="space-y-2">
            {availableOptions(chapter, choices).map((o) => (
              <button
                key={o.id}
                onClick={() => setChoices({ ...choices, [chapter.id]: o.id })}
                className={`w-full text-left border rounded-lg p-4 transition-colors ${
                  choices[chapter.id] === o.id ? "border-amber-600 bg-amber-950/20" : "border-stone-800 hover:border-stone-600"
                }`}
              >
                <p className="font-bold text-stone-200 text-sm">{o.label}</p>
                <p className="text-xs text-stone-500 mt-1">{o.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="border-stone-700 text-stone-400 text-xs uppercase">Back</Button>
            <Button disabled={!choices[chapter.id]} onClick={() => setStep(step + 1)} className="bg-amber-800 hover:bg-amber-700 text-xs uppercase tracking-wider">Continue</Button>
          </div>
        </div>
      )}

      {isIdentityStep && (
        <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-6 space-y-5">
          <p className="text-[10px] uppercase tracking-widest text-amber-700">Final Chapter — Doctrine & Identity</p>
          {IDENTITY_GROUPS.map((g) => (
            <div key={g.key}>
              <h3 className="text-sm font-bold text-stone-200 mb-2">{g.title}</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {g.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setIdentity({ ...identity, [g.key]: o.id })}
                    className={`text-left border rounded-lg p-3 ${
                      identity[g.key] === o.id ? "border-amber-600 bg-amber-950/20" : "border-stone-800 hover:border-stone-600"
                    }`}
                  >
                    <p className="font-bold text-stone-200 text-xs">{o.label}</p>
                    <p className="text-[11px] text-stone-500 mt-1">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-stone-700 text-stone-400 text-xs uppercase">Back</Button>
            <Button
              disabled={!identity.doctrine || !identity.philosophy || !identity.value || loading}
              onClick={synthesize}
              className="bg-red-900 hover:bg-red-800 text-xs uppercase tracking-wider"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Synthesizing history…</> : "Forge the Nation"}
            </Button>
          </div>
        </div>
      )}

      {isReviewStep && result && (
        <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-6 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-700">Dossier Complete</p>
            <h2 className="text-2xl font-bold text-stone-100 mt-1">{result.factionName}</h2>
            <p className="text-xs text-stone-500 italic mt-1">{result.insigniaDescription}</p>
          </div>
          <p className="text-sm text-stone-400 whitespace-pre-line">{result.lore}</p>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-2">National Traits</h3>
            <div className="space-y-2">
              {result.traits.map((t, i) => (
                <div key={i} className="border border-stone-800 rounded p-3">
                  <p className="text-sm font-bold text-stone-200">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-1">Standing with NPC Powers</h3>
            <div className="flex gap-4 text-xs">
              {Object.entries(result.npcDispositions).map(([k, v]) => (
                <span key={k} className={v > 5 ? "text-green-500" : v < -5 ? "text-red-500" : "text-stone-400"}>
                  {k}: {v > 0 ? "+" : ""}{v}
                </span>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" disabled={loading} onClick={synthesize} className="border-stone-700 text-stone-400 text-xs uppercase">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />} Rewrite History
            </Button>
            <Button disabled={saving} onClick={save} className="bg-amber-800 hover:bg-amber-700 text-xs uppercase tracking-wider">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Enlist Faction
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}