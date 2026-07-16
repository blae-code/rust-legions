import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Shield, Pencil } from "lucide-react";
import SlotPicker from "@/components/army/SlotPicker";
import DesignStats from "@/components/army/DesignStats";
import { SLOT_KEYS, DESIGN_SLOTS, DEFAULT_DESIGN, compileDesign } from "@/lib/armyDesign";

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
            <Button disabled={busy || !draft.name.trim()} onClick={save} className="flex-1">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Design" : "Commit Design"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={() => { setEditingId(null); setDraft({ name: "", ...DEFAULT_DESIGN }); }}>Cancel</Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="cq-label">Registered Designs</p>
          {designs === null ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : designs.length === 0 ? (
            <p className="text-xs text-muted-foreground font-mono">No designs on file. Draft your first doctrine pattern.</p>
          ) : (
            designs.map((d) => (
              <div key={d.id} className="cq-panel p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-heading font-semibold text-sm tracking-wide text-foreground">{d.name}</p>
                  <div className="flex gap-1">
                    <button title="Edit" onClick={() => { setEditingId(d.id); setDraft({ name: d.name, formation: d.formation, weapon: d.weapon, armor: d.armor, support: d.support }); }} className="text-muted-foreground hover:text-brass-bright"><Pencil className="w-3.5 h-3.5" /></button>
                    <button title="Delete" onClick={() => remove(d.id)} className="text-muted-foreground hover:text-rust"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  {SLOT_KEYS.map((s) => DESIGN_SLOTS[s].options[d[s]]?.label).filter(Boolean).join(" · ")}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}