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
        <p className="cq-label">Ministry of Heraldry · Registration</p>
        <h1 className="cq-display text-4xl">Faction Lifepath</h1>
        <p className="text-sm text-muted-foreground font-heading tracking-wide mt-1">Your choices become your nation's history — synthesized into traits, lore, and standing with NPC powers.</p>
      </div>

      <div className="flex gap-1">
        {[...LIFEPATH_CHAPTERS.map((c) => c.title), "Identity", "Review"].map((t, i) => (
          <div key={t} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-brass" : "bg-secondary"}`} />
        ))}
      </div>

      {!isIdentityStep && !isReviewStep && (
        <div className="cq-panel p-6 space-y-4">
          <div>
            <p className="cq-label text-brass">Chapter {step + 1} — {chapter.title}</p>
            <h2 className="text-xl font-heading font-semibold tracking-wide text-foreground mt-1">{chapter.prompt}</h2>
          </div>
          <div className="space-y-2">
            {availableOptions(chapter, choices).map((o) => (
              <button
                key={o.id}
                onClick={() => setChoices({ ...choices, [chapter.id]: o.id })}
                className={`w-full text-left border rounded-sm p-4 transition-colors ${
                  choices[chapter.id] === o.id ? "border-brass bg-brass/10" : "border-border hover:border-steel"
                }`}
              >
                <p className="font-heading font-semibold tracking-wide text-foreground text-sm">{o.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{o.desc}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)} className="border-border text-muted-foreground text-xs font-heading uppercase tracking-[0.2em]">Back</Button>
            <Button disabled={!choices[chapter.id]} onClick={() => setStep(step + 1)} className="bg-brass hover:bg-brass-bright text-primary-foreground text-xs font-heading uppercase tracking-[0.2em]">Continue</Button>
          </div>
        </div>
      )}

      {isIdentityStep && (
        <div className="cq-panel p-6 space-y-5">
          <p className="cq-label text-brass">Final Chapter — Doctrine & Identity</p>
          {IDENTITY_GROUPS.map((g) => (
            <div key={g.key}>
              <h3 className="text-sm font-heading font-semibold tracking-wide text-foreground mb-2">{g.title}</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                {g.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setIdentity({ ...identity, [g.key]: o.id })}
                    className={`text-left border rounded-sm p-3 transition-colors ${
                      identity[g.key] === o.id ? "border-brass bg-brass/10" : "border-border hover:border-steel"
                    }`}
                  >
                    <p className="font-heading font-semibold tracking-wide text-foreground text-xs">{o.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {error && <p className="text-xs text-rust font-mono">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} className="border-border text-muted-foreground text-xs font-heading uppercase tracking-[0.2em]">Back</Button>
            <Button
              disabled={!identity.doctrine || !identity.philosophy || !identity.value || loading}
              onClick={synthesize}
              className="bg-rust hover:bg-destructive text-destructive-foreground text-xs font-heading uppercase tracking-[0.2em]"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Synthesizing history…</> : "Forge the Nation"}
            </Button>
          </div>
        </div>
      )}

      {isReviewStep && result && (
        <div className="cq-panel p-6 space-y-4 relative overflow-hidden">
          <div className="cq-hazard absolute top-0 left-0 right-0" />
          <div className="pt-1">
            <p className="cq-label text-brass">Dossier Complete</p>
            <h2 className="cq-display text-3xl mt-1">{result.factionName}</h2>
            <p className="text-xs text-muted-foreground italic mt-1">{result.insigniaDescription}</p>
          </div>
          <p className="text-sm text-secondary-foreground whitespace-pre-line leading-relaxed">{result.lore}</p>
          <div>
            <h3 className="cq-label mb-2">National Traits</h3>
            <div className="space-y-2">
              {result.traits.map((t, i) => (
                <div key={i} className="border border-border bg-secondary/30 rounded-sm p-3">
                  <p className="text-sm font-heading font-semibold tracking-wide text-brass-bright">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="cq-label mb-1">Standing with NPC Powers</h3>
            <div className="flex gap-4 text-xs font-mono">
              {Object.entries(result.npcDispositions).map(([k, v]) => (
                <span key={k} className={v > 5 ? "text-olive" : v < -5 ? "text-rust" : "text-muted-foreground"}>
                  {k}: {v > 0 ? "+" : ""}{v}
                </span>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-rust font-mono">{error}</p>}
          <div className="flex justify-between">
            <Button variant="outline" disabled={loading} onClick={synthesize} className="border-border text-muted-foreground text-xs font-heading uppercase tracking-[0.2em]">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />} Rewrite History
            </Button>
            <Button disabled={saving} onClick={save} className="bg-brass hover:bg-brass-bright text-primary-foreground text-xs font-heading uppercase tracking-[0.2em]">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Enlist Faction
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}