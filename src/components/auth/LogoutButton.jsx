import React from "react";
import { LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import CommandTip from "@/components/ui/CommandTip";

// Stand down — ends the session and returns to the login terminal.
export default function LogoutButton() {
  return (
    <CommandTip title="Stand Down" body="Sign out of this terminal.">
      <button
        onClick={() => base44.auth.logout("/login")}
        className="p-1.5 rounded-sm border border-border text-muted-foreground hover:text-rust hover:border-rust/60 transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </CommandTip>
  );
}