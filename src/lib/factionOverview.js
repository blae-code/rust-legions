// Faction Overview — one aggregated read of the war effort, assembled from what
// getState already reveals: holdings & accords, the supply network, and every
// standing bonus (doctrine in service, recovered relics, matched sets).
import { ledgerReport } from "@/lib/macro/ledger";
import { protectorateReport } from "@/lib/protectorate";
import { TECHS, DOCTRINE_BRANCHES } from "@/lib/doctrine";
import { RELICS, RELIC_SETS } from "@/lib/relics";

export function overviewReport(game) {
  const ledger = ledgerReport(game);
  const protectorate = protectorateReport(game);
  const research = game?.myResearch || {};
  const completed = research.completed || [];

  const bonuses = [
    ...completed.map((id) => ({
      key: `tech-${id}`,
      source: DOCTRINE_BRANCHES[TECHS[id]?.branch]?.label || "Doctrine",
      label: TECHS[id]?.label || id,
      effect: TECHS[id]?.effect || "",
    })),
    ...(game?.myRelics || []).map((r) => ({
      key: `relic-${r.id}`,
      source: "Relic",
      label: r.label || RELICS[r.id]?.label || r.id,
      effect: RELICS[r.id]?.effect || "",
    })),
    ...(game?.myRelicSets || []).map((id) => ({
      key: `set-${id}`,
      source: "Matched Set",
      label: RELIC_SETS[id]?.label || id,
      effect: RELIC_SETS[id]?.effect || "",
    })),
  ];

  const focusTech = research.focus ? TECHS[research.focus] : null;

  return {
    ledger,
    protectorate,
    bonuses,
    focus: focusTech
      ? {
          label: focusTech.label,
          progress: (research.progress || {})[research.focus] || 0,
          cost: focusTech.cost,
        }
      : null,
    columns: (game?.macro?.columns || []).filter((c) => c.owner === game.mySlot),
  };
}