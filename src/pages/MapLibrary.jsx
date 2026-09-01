import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, Check } from "lucide-react";
import { buildWorldFromNodes, WORLDS } from "@/lib/macro/worlds";
import { CHART } from "@/lib/macro/graph";
import MinistryChart from "@/components/chart/MinistryChart";
import StarRating from "@/components/maps/StarRating";
import MapRatingPanel from "@/components/maps/MapRatingPanel";

const planetName = (id) => WORLDS.find((w) => w.id === id)?.name || "Cindara";

export default function MapLibrary() {
  const preselect = new URLSearchParams(window.location.search).get("mapId");
  const [maps, setMaps] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [authors, setAuthors] = useState({});
  const [previewId, setPreviewId] = useState(preselect);
  const [planetFilter, setPlanetFilter] = useState("all");
  const [countFilter, setCountFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Only node-based war charts survive the hex retirement
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 100)
      .then((all) => setMaps(all.filter((m) => (m.nodes || []).length > 0)));
    base44.entities.MapRating.list("-created_date", 500).then(setRatings).catch(() => setRatings([]));
    // Cartographer callsigns — the only identity we ever show
    base44.entities.UserProfile.list(undefined, 500)
      .then((profiles) => setAuthors(Object.fromEntries(profiles.map((p) => [p.created_by_id, p.displayName]))))
      .catch(() => setAuthors({}));
  }, []);

  const ratingSummary = (mapId) => {
    const rs = ratings.filter((r) => r.mapId === mapId);
    if (rs.length === 0) return { avg: 0, count: 0 };
    return { avg: rs.reduce((s, r) => s + r.stars, 0) / rs.length, count: rs.length };
  };

  const filtered = (maps || [])
    .filter((m) =>
      (planetFilter === "all" || (m.planetId || "cindara") === planetFilter) &&
      (countFilter === "all" || (m.recommendedPlayerCount || 2) === Number(countFilter))
    )
    .sort((a, b) => {
      if (sortBy === "top") {
        const ra = ratingSummary(a.id), rb = ratingSummary(b.id);
        return rb.avg - ra.avg || rb.count - ra.count;
      }
      if (sortBy === "most") return ratingSummary(b.id).count - ratingSummary(a.id).count;
      return 0; // newest — already sorted by -created_date
    });

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/maps?mapId=${previewId}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const preview = maps?.find((m) => m.id === previewId);
  const previewWorld = preview
    ? buildWorldFromNodes(preview.nodes.map((n) => ({ ...n })), (preview.routes || []).map((r) => [...r]), 7)
    : { nodes: [], routes: [], continents: [], size: { ...CHART } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <p className="cq-label">Cartography Division</p>
          <h1 className="cq-display text-4xl">Map Library</h1>
          <p className="text-sm text-muted-foreground font-heading tracking-wide">Theaters of war, built by commanders.</p>
        </div>
        <Link to="/map-editor">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground text-xs font-heading uppercase tracking-[0.2em]">Build a Map</Button>
        </Link>
      </div>

      {maps === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : maps.length === 0 ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded p-10 text-center font-heading tracking-wide">
          The library is empty. Build a map or generate one when starting a game.
        </p>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] 2xl:grid-cols-[380px_1fr] gap-4">
          <div className="space-y-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide"
              aria-label="Sort charts"
            >
              <option value="newest">Newest first</option>
              <option value="top">Highest rated</option>
              <option value="most">Most assessed</option>
            </select>
            <div className="flex gap-2">
              <select
                value={planetFilter}
                onChange={(e) => setPlanetFilter(e.target.value)}
                className="flex-1 bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide"
                aria-label="Filter by planet"
              >
                <option value="all">All planets</option>
                {WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <select
                value={countFilter}
                onChange={(e) => setCountFilter(e.target.value)}
                className="flex-1 bg-input border border-border rounded-sm p-1.5 text-xs text-secondary-foreground font-heading tracking-wide"
                aria-label="Filter by recommended commanders"
              >
                <option value="all">Any commanders</option>
                {[2, 3, 4].map((n) => <option key={n} value={n}>{n} commanders</option>)}
              </select>
            </div>
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground font-mono border border-dashed border-border rounded p-4 text-center">
                NO CHARTS MATCH THESE FILTERS
              </p>
            )}
            <div className="space-y-2 max-h-[560px] lg:max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setPreviewId(m.id)}
                className={`w-full text-left border rounded-sm p-3 transition-colors ${previewId === m.id ? "border-brass bg-brass/10" : "border-border bg-card hover:border-steel"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-heading font-semibold tracking-wide text-foreground text-sm truncate">{m.name}</p>
                  {ratingSummary(m.id).count > 0 && (
                    <span className="flex items-center gap-1 shrink-0">
                      <StarRating value={Math.round(ratingSummary(m.id).avg)} size="w-3 h-3" />
                      <span className="font-mono text-[9px] text-muted-foreground">({ratingSummary(m.id).count})</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">{planetName(m.planetId)} · {(m.nodes || []).length} settlements · {m.recommendedPlayerCount} players</p>
                {authors[m.created_by_id] && (
                  <p className="font-mono text-[9px] text-brass/80 tracking-widest mt-0.5">CHARTED BY {authors[m.created_by_id].toUpperCase()}</p>
                )}
                {m.description && <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2">{m.description}</p>}
              </button>
            ))}
            </div>
          </div>
          <div className="cq-panel p-3 bg-gradient-to-b from-card to-background">
            {preview ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <div className="min-w-0">
                    <h2 className="font-heading font-semibold text-lg tracking-wide text-foreground truncate">{preview.name}</h2>
                    {authors[preview.created_by_id] && (
                      <p className="font-mono text-[10px] text-brass/80 tracking-widest">CHARTED BY {authors[preview.created_by_id].toUpperCase()}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyShareLink}
                      className="border-border text-muted-foreground hover:text-brass text-xs font-heading uppercase tracking-[0.2em]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} {copied ? "Copied" : "Share"}
                    </Button>
                    <Link to={`/new-game?mapId=${preview.id}`}>
                      <Button size="sm" className="bg-rust hover:bg-destructive text-destructive-foreground text-xs font-heading uppercase tracking-[0.2em]">Play This Map</Button>
                    </Link>
                  </div>
                </div>
                <MinistryChart world={previewWorld} height="48vh" />
                <MapRatingPanel
                  map={preview}
                  ratings={ratings.filter((r) => r.mapId === preview.id)}
                  onRatingsChange={(next) => setRatings([...ratings.filter((r) => r.mapId !== preview.id), ...next])}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16 font-heading tracking-wide">Select a map to preview it.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}