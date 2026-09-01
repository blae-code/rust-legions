import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Medal } from "lucide-react";
import CommanderRankRow from "@/components/leaderboard/CommanderRankRow";

// The Ministry's Roll of Honour — commanders ranked by wars carried,
// campaigns concluded breaking any tie.
export default function Leaderboard() {
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    base44.entities.UserProfile.list("-gamesWon", 200).then(setProfiles).catch(() => setProfiles([]));
  }, []);

  const ranked = useMemo(() => {
    if (!profiles) return [];
    return [...profiles].sort(
      (a, b) =>
        (b.gamesWon || 0) - (a.gamesWon || 0) ||
        (b.campaignsCompleted || 0) - (a.campaignsCompleted || 0) ||
        (b.gamesPlayed || 0) - (a.gamesPlayed || 0)
    );
  }, [profiles]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="cq-panel relative overflow-hidden p-5">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <p className="cq-label text-rust pt-1">Ministry of War · Honours Directorate</p>
        <h1 className="cq-display text-3xl sm:text-4xl leading-none mt-1 flex items-center gap-3">
          <Medal className="w-7 h-7 text-brass" /> Roll of Honour
        </h1>
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1.5">
          RANKED BY WARS CARRIED · CAMPAIGNS CONCLUDED BREAK THE TIE
        </p>
      </div>

      {profiles === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brass" />
        </div>
      ) : ranked.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest text-center py-16">
          NO SERVICE RECORDS ON FILE — THE ROLL AWAITS ITS FIRST COMMANDER
        </p>
      ) : (
        <div className="grid gap-2 xl:grid-cols-2">
          {ranked.map((p, i) => (
            <CommanderRankRow key={p.id} rank={i + 1} profile={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}