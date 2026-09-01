import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import useCallsign from "@/hooks/useCallsign";
import { Loader2 } from "lucide-react";
import StarRating from "@/components/maps/StarRating";

// Field Assessments — the rating desk for one published chart.
// One rating per commander per map: an existing rating is updated in place.
export default function MapRatingPanel({ map, ratings, onRatingsChange }) {
  const { user } = useUser();
  const callsign = useCallsign();
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const mine = ratings.find((r) => r.created_by_id === user?.id);
  const isOwnMap = map.created_by_id === user?.id;

  useEffect(() => {
    setRemark(mine?.remark || "");
  }, [map.id, mine?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rate = async (stars) => {
    setSaving(true);
    const data = { mapId: map.id, stars, remark: remark.trim(), callsign: callsign || "UNSIGNED" };
    const saved = mine
      ? await base44.entities.MapRating.update(mine.id, data)
      : await base44.entities.MapRating.create(data);
    onRatingsChange(mine ? ratings.map((r) => (r.id === mine.id ? saved : r)) : [...ratings, saved]);
    setSaving(false);
  };

  const remarks = ratings.filter((r) => r.remark).slice(0, 6);

  return (
    <div className="border-t border-border/60 pt-3 space-y-3">
      {/* rate it */}
      {isOwnMap ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
          A CARTOGRAPHER MAY NOT ASSESS THEIR OWN CHART
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="cq-label">{mine ? "Your Assessment" : "File an Assessment"}</span>
            <StarRating value={mine?.stars || 0} onRate={saving ? undefined : rate} size="w-5 h-5" />
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex gap-2">
            <input
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={140}
              placeholder="Optional field remark — supply lines thin in the east…"
              className="flex-1 bg-input border border-border rounded-sm px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60"
            />
            {mine && remark.trim() !== (mine.remark || "") && (
              <button
                onClick={() => rate(mine.stars)}
                disabled={saving}
                className="cq-metal px-3 rounded-sm text-[10px] font-heading uppercase tracking-[0.2em] text-brass hover:text-brass-bright disabled:opacity-50"
              >
                File
              </button>
            )}
          </div>
        </div>
      )}

      {/* recent remarks */}
      {remarks.length > 0 && (
        <div className="space-y-1.5">
          <p className="cq-label">Field Remarks</p>
          {remarks.map((r) => (
            <div key={r.id} className="flex items-start gap-2 text-xs">
              <StarRating value={r.stars} size="w-3 h-3" />
              <p className="text-foreground/85 leading-snug flex-1 min-w-0">
                {r.remark}
                <span className="font-mono text-[9px] text-muted-foreground tracking-widest ml-2">
                  — {(r.callsign || "UNSIGNED").toUpperCase()}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}