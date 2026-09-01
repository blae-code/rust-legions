import React from "react";
import { HelpCircle } from "lucide-react";
import CommandTip from "@/components/ui/CommandTip";

// A tiny help glyph beside a form label — hover for the survey slip
export default function LabelTip({ title, body }) {
  return (
    <CommandTip title={title} body={body}>
      <span className="inline-flex align-middle ml-1.5 text-muted-foreground/60 hover:text-brass-bright transition-colors cursor-help">
        <HelpCircle className="w-3 h-3" />
      </span>
    </CommandTip>
  );
}