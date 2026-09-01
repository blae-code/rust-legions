import React from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Ministry-issue tooltip — a small brass-edged survey slip on hover
export default function CommandTip({ title, body, side = "bottom", children }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          sideOffset={8}
          className="max-w-[250px] bg-card border border-brass/40 text-foreground rounded-sm px-3 py-2 shadow-[0_6px_16px_rgba(0,0,0,0.65)]"
        >
          <p className="font-heading uppercase tracking-[0.2em] text-[10px] text-brass-bright">{title}</p>
          {body && <p className="font-mono text-[10px] text-muted-foreground mt-1 leading-relaxed">{body}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}