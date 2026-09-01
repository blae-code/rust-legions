import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Shield } from "lucide-react";
import SlotPicker from "@/components/army/SlotPicker";
import DesignStats from "@/components/army/DesignStats";
import DesignCard from "@/components/army/DesignCard";
import { SLOT_KEYS, DEFAULT_DESIGN, compileDesign } from "@/lib/armyDesign";
import CommandTip from "@/components/ui/CommandTip";
import LabelTip from "@/components/ui/LabelTip";

export default function ArmyDesigner() {
  const [designs, setDesigns] = useState(null);
  const [draft, setDraft] = useState({ name: "", ...DEFAULT_DESIGN });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const me = await base44.auth.me();
    setDesigns(await base44.entities.ArmyDesign.filter({ created_by_id: me.id }, "-updated_date"));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    if (editingId) await base44.entities.ArmyDesign.update(editingId, draft);
    else await base44.entities.ArmyDesign.create(draft);
    setDraft({ name: "", ...DEFAULT_DESIGN });
    setEditingId(null);
    await load();
    setBusy(false);
  };

  // Recall a filed pattern onto the drafting table — missing slots fall back to issue standard
  const recall = (d) => {
    setEditingId(d.id);
    setDraft({
      name: d.name || "",
      formation: d.formation || DEFAULT_DESIGN.formation,
      weapon: d.weapon || DEFAULT_DESIGN.weapon,
      armor: d.armor || DEFAULT_DESIGN.armor,
      support: d.support || DEFAULT_DESIGN.support,
    });
  };

  const remove = async (id) => {
    setBusy(true);
    if (editingId === id) { setEditingId(null); setDraft({ name: "", ...DEFAULT_DESIGN }); }
    await base44.entities.ArmyDesign.delete(id);
    await load();
    setBusy(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="cq-panel relative overflow-hidden px-5 pt-5 pb-4">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <h1 className="cq-display text-3xl flex items-center gap-2"><Shield className="w-6 h-6 text-brass" /> Army Design Bureau</h1>
        <p className="text-xs text-muted-foreground font-mono mt-1">DRAFT DOCTRINE PATTERNS — FORMATION, WEAPONS, ARMOR, SUPPORT. APPLY THEM WHEN MUSTERING FIELD ARMIES.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="cq-panel cq-brackets p-5 space-y-4">
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Design name — e.g. Stormbreaker Pattern"
            className="font-heading tracking-wide"
          />
          {SLOT_KEYS.map((slot) => (
            <SlotPicker key={slot} slotKey={slot} value={draft[slot]} onChange={(v) => setDraft({ ...draft, [slot]: v })} />
          ))}
          <DesignStats compiled={compileDesign(draft)} />
          <div className="flex gap-2">
            <CommandTip title={editingId ? "Update Design" : "Commit Design"} body="File this pattern with the Bureau — recall it when mustering field armies in a war.">
              <Button disabled={busy || !draft.name.trim()} onClick={save} className="flex-1">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Design" : "Commit Design"}
              </Button>
            </CommandTip>
            {editingId && (
              <Button variant="secondary" onClick={() => { setEditingId(null); setDraft({ name: "", ...DEFAULT_DESIGN }); }}>Cancel</Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="cq-label">Registered Designs<LabelTip title="Registered Designs" body="Your filed patterns. Click one to recall it onto the drafting table for edits." /></p>
          {designs === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : designs.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No designs on file. Draft your first doctrine pattern.</p>
          ) : (
            designs.map((d) => (
              <DesignCard key={d.id} design={d} active={editingId === d.id} onRecall={recall} onDelete={remove} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}