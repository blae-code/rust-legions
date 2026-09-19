import React from "react";
import { Hammer, Star, Flag, Cross } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Image } from "@/components/ui/image";
import { MEDALS } from "@/lib/medals";
import { getImage } from "@/lib/imageLibrary";

const ICONS = { iron_hammer: Hammer, brass_star: Star, defiant_standard: Flag, marshals_cross: Cross };
const TONES = {
  iron_hammer: "border-rust/60 text-rust",
  brass_star: "border-brass/70 text-brass-bright",
  defiant_standard: "border-steel/70 text-steel",
  marshals_cross: "border-brass/70 text-brass-bright",
};

export default function MedalBadge({ medalId, compact = false }) {
  const medal = MEDALS[medalId];
  if (!medal) return null;
  const Icon = ICONS[medalId];
  const art = getImage(`medal_${medalId}`);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`${medal.label} — view award criteria`} title={medal.label}
          className={`cq-metal inline-flex items-center gap-2 rounded-sm border border-t-4 bg-secondary/50 px-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass ${TONES[medalId]}`}>
          {art ? <Image src={art} alt="" fittingType="fit" className="w-7 h-7 shrink-0" /> : <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />}
          {!compact && <span className="font-heading uppercase tracking-wider text-xs text-foreground">{medal.label}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="cq-slip w-72 p-3" side="top">
        <p className="cq-label text-brass mb-1">Combat honour · Awarded</p>
        <p className="font-heading uppercase tracking-wider text-foreground">{medal.label}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{medal.requirement}</p>
      </PopoverContent>
    </Popover>
  );
}