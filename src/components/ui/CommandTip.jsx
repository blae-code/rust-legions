import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Ministry-issue tooltip — a grit-textured brass-nicked survey slip on hover
export default function CommandTip({ title, body, side = "bottom", children }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={8}
          className="cq-slip max-w-[250px] rounded-sm border-0 bg-transparent p-0 text-foreground shadow-none"
        >
          <div className="cq-hazard opacity-70" />
          <div className="px-3 py-2">
            <p className="font-heading uppercase tracking-[0.22em] text-[10px] text-brass-bright drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]">
              {title}
            </p>
            {body && (
              <p className="font-mono text-[10px] text-muted-foreground mt-1 leading-relaxed">{body}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}