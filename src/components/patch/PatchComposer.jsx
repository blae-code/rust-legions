import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { CHANGE_CATEGORIES, CATEGORY_KEYS } from "@/components/patch/patchMeta";

const emptyChange = () => ({ category: "new_content", title: "", description: "", impact: "" });

// Admin-only drafting desk for new War Ministry patch dispatches
export default function PatchComposer({ open, onClose, onSaved, patch }) {
  const [form, setForm] = useState(() => patch || {
    version: "", codename: "", title: "", summary: "",
    releaseDate: new Date().toISOString().slice(0, 10),
    isPublished: false, changes: [emptyChange()],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setChange = (i, k, v) => setForm((f) => ({ ...f, changes: f.changes.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));

  const save = async (publish) => {
    if (!form.version.trim() || !form.title.trim()) { setError("Version and title are required"); return; }
    setBusy(true);
    setError("");
    const data = { ...form, isPublished: publish, changes: form.changes.filter((c) => c.title.trim()) };
    if (patch?.id) await base44.entities.Patch.update(patch.id, data);
    else await base44.entities.Patch.create(data);
    setBusy(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="cq-display text-xl">{patch ? "Revise Dispatch" : "Draft New Dispatch"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="cq-label mb-1">Version</p>
              <Input value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="1.1.0" />
            </div>
            <div>
              <p className="cq-label mb-1">Codename</p>
              <Input value={form.codename} onChange={(e) => set("codename", e.target.value)} placeholder="Operation Iron Rain" />
            </div>
            <div>
              <p className="cq-label mb-1">Release Date</p>
              <Input type="date" value={form.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} />
            </div>
          </div>
          <div>
            <p className="cq-label mb-1">Title</p>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="A one-line banner for this amendment" />
          </div>
          <div>
            <p className="cq-label mb-1">Summary (markdown)</p>
            <Textarea rows={3} value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="The Ministry's word on what this patch means for the war..." />
          </div>

          <p className="cq-label pt-1">Amendments</p>
          {form.changes.map((c, i) => (
            <div key={i} className="border border-border rounded-sm p-3 space-y-2 bg-background/40">
              <div className="flex gap-2">
                <select
                  value={c.category}
                  onChange={(e) => setChange(i, "category", e.target.value)}
                  className="bg-input border border-border rounded-sm text-xs font-heading uppercase tracking-wider px-2 h-9"
                >
                  {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CHANGE_CATEGORIES[k].code} — {CHANGE_CATEGORIES[k].label}</option>)}
                </select>
                <Input className="flex-1" value={c.title} onChange={(e) => setChange(i, "title", e.target.value)} placeholder="Amendment title" />
                <Button variant="ghost" size="icon" onClick={() => set("changes", form.changes.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-rust" />
                </Button>
              </div>
              <Textarea rows={2} value={c.description} onChange={(e) => setChange(i, "description", e.target.value)} placeholder="What changed, in detail" />
              <Input value={c.impact} onChange={(e) => setChange(i, "impact", e.target.value)} placeholder="Impact on the front — how this affects players and gameplay" />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set("changes", [...form.changes, emptyChange()])}>
            <Plus className="w-3.5 h-3.5" /> Add Amendment
          </Button>

          {error && <p className="text-xs text-rust font-mono">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" disabled={busy} onClick={() => save(false)}>Save Draft</Button>
            <Button disabled={busy} onClick={() => save(true)}>Publish to the Front</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}