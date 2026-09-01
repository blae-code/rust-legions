import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Compass, Archive } from "lucide-react";
import { buildWorldFromNodes, WORLDS } from "@/lib/macro/worlds";
import { CHART } from "@/lib/macro/graph";
import ArchiveHeader from "@/components/maps/ArchiveHeader";
import ArchiveFilterBar from "@/components/maps/ArchiveFilterBar";
import ChartIndexCard from "@/components/maps/ChartIndexCard";
import ChartDossier from "@/components/maps/ChartDossier";

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

  const preview = maps?.find((m) => m.id === previewId);
  const previewWorld = preview
    ? buildWorldFromNodes(preview.nodes.map((n) => ({ ...n })), (preview.routes || []).map((r) => [...r]), 7)
    : { nodes: [], routes: [], continents: [], size: { ...CHART } };

  const settlementCount = (maps || []).reduce((n, m) => n + (m.nodes || []).length, 0);

  return (
    <div className="max-w-3xl xl:max-w-[1500px] mx-auto space-y-4 cq-page-in">
      <ArchiveHeader chartCount={(maps || []).length} settlementCount={settlementCount} />

      {maps === null ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 className="w-5 h-5 animate-spin text-brass/70" />
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.25em]">PULLING THE SURVEY DRAWERS…</span>
        </div>
      ) : maps.length === 0 ? (
        <div className="cq-panel p-10 text-center space-y-3">
          <Archive className="w-7 h-7 mx-auto text-muted-foreground/40" />
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
            THE ARCHIVE HOLDS NO SURVEYS. NO COMMANDER HAS YET PUT PEN TO THE CONTINENT.
          </p>
          <Link to="/map-editor">
            <Button variant="outline" className="text-xs"><Compass className="w-3.5 h-3.5" /> Draft the First Chart</Button>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] 2xl:grid-cols-[360px_1fr] gap-4 items-start">
          <div className="space-y-2">
            <ArchiveFilterBar
              sortBy={sortBy}
              setSortBy={setSortBy}
              planetFilter={planetFilter}
              setPlanetFilter={setPlanetFilter}
              countFilter={countFilter}
              setCountFilter={setCountFilter}
              shown={filtered.length}
              total={maps.length}
            />
            {filtered.length === 0 ? (
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] border border-dashed border-border rounded-sm p-5 text-center">
                NO CHART IN THE DRAWER MATCHES THESE TERMS
              </p>
            ) : (
              <div className="space-y-2 max-h-[560px] lg:max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
                {filtered.map((m, i) => (
                  <ChartIndexCard
                    key={m.id}
                    map={m}
                    index={i}
                    planet={planetName(m.planetId)}
                    author={authors[m.created_by_id]}
                    rating={ratingSummary(m.id)}
                    selected={previewId === m.id}
                    onSelect={setPreviewId}
                  />
                ))}
              </div>
            )}
          </div>

          {preview ? (
            <ChartDossier
              map={preview}
              world={previewWorld}
              planet={planetName(preview.planetId)}
              author={authors[preview.created_by_id]}
              rating={ratingSummary(preview.id)}
              ratings={ratings.filter((r) => r.mapId === preview.id)}
              onRatingsChange={(next) => setRatings([...ratings.filter((r) => r.mapId !== preview.id), ...next])}
            />
          ) : (
            <div className="cq-panel flex flex-col items-center justify-center gap-2 py-24 text-center">
              <Compass className="w-8 h-8 text-muted-foreground/30" />
              <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] max-w-xs leading-relaxed">
                DRAW A CHART FROM THE INDEX TO OPEN ITS SURVEY DOSSIER
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}