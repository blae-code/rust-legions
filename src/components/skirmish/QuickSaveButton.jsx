import React, { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuickSaveButton({ onSave, savedAt }) {
  const [lastSaved, setLastSaved] = useState(savedAt);
  const [error, setError] = useState("");
  const save = () => {
    try {
      const saved = onSave();
      setLastSaved(saved.snapshot.savedAt);
      setError("");
    } catch {
      setError("Quick-save failed. Keep this tab open and try again.");
    }
  };
  return (
    <div className="space-y-1">
      <Button size="sm" variant="outline" onClick={save} title="Save this board in the current browser tab">
        <Save className="w-3.5 h-3.5" /> Quick Save
      </Button>
      <p aria-live="polite" className={`text-[10px] ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {error || (lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()} · This tab only` : "This tab only")}
      </p>
    </div>
  );
}