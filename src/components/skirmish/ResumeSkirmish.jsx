import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { readSkirmish } from "@/lib/skirmish/session";
import { Button } from "@/components/ui/button";

export default function ResumeSkirmish() {
  const [saved] = useState(readSkirmish);
  if (!saved?.snapshot) return null;
  return (
    <div className="cq-panel p-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="cq-label text-brass-bright">Saved Skirmish · {saved.scenarioName}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {saved.snapshot.phase === "deployment" ? "Deployment" : "Battle"} saved {new Date(saved.snapshot.savedAt).toLocaleString()}.
          {" "}Available in this tab; starting a new skirmish replaces it.
        </p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link to="/tactical-preview"><Play className="w-3.5 h-3.5" /> Resume Skirmish</Link>
      </Button>
    </div>
  );
}