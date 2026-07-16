import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import HexBoard from "@/components/hexmap/HexBoard";

export default function MapLibrary() {
  const [maps, setMaps] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    base44.entities.GameMap.filter({ isPublished: true }, "-created_date", 100).then(setMaps);
  }, []);

  const preview = maps?.find((m) => m.id === previewId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-stone-100">Map Library</h1>
          <p className="text-sm text-stone-500">Theaters of war, built by commanders.</p>
        </div>
        <Link to="/map-editor">
          <Button variant="outline" className="border-stone-700 text-stone-400 text-xs uppercase tracking-wider">Build a Map</Button>
        </Link>
      </div>

      {maps === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-stone-600" /></div>
      ) : maps.length === 0 ? (
        <p className="text-sm text-stone-600 border border-dashed border-stone-800 rounded-lg p-10 text-center">
          The library is empty. Build a map or generate one when starting a game.
        </p>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {maps.map((m) => (
              <button
                key={m.id}
                onClick={() => setPreviewId(m.id)}
                className={`w-full text-left border rounded-lg p-3 ${previewId === m.id ? "border-amber-700 bg-amber-950/10" : "border-stone-800 bg-[#1C1714] hover:border-stone-600"}`}
              >
                <p className="font-bold text-stone-200 text-sm">{m.name}</p>
                <p className="text-xs text-stone-500">{m.tiles?.length} zones · {m.recommendedPlayerCount} players</p>
                {m.description && <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">{m.description}</p>}
              </button>
            ))}
          </div>
          <div className="border border-stone-800 bg-stone-950 rounded-lg p-3">
            {preview ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-stone-200">{preview.name}</h2>
                  <Link to={`/new-game?mapId=${preview.id}`}>
                    <Button size="sm" className="bg-red-900 hover:bg-red-800 text-xs uppercase tracking-wider">Play This Map</Button>
                  </Link>
                </div>
                <HexBoard tiles={preview.tiles} maxHeight={480} />
              </div>
            ) : (
              <p className="text-sm text-stone-600 text-center py-16">Select a map to preview it.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}