import React from "react";
import { base44 } from "@/api/base44Client";
import { ShieldAlert } from "lucide-react";
import AuthScene from "@/components/auth/AuthScene";

// Shown when an authenticated identity is not cleared for this app.
const UserNotRegisteredError = () => (
  <AuthScene
    eyebrow="Ministry of War · Security Office"
    title="Clearance Denied"
    subtitle="YOUR IDENTITY IS NOT ON THE ROLL FOR THIS THEATER"
    stamp="Denied"
    footer={
      <button
        onClick={() => base44.auth.logout(window.location.origin)}
        className="font-heading uppercase tracking-[0.15em] text-xs text-brass hover:text-brass-bright transition-colors"
      >
        Sign out & present another identity →
      </button>
    }
  >
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <ShieldAlert className="w-10 h-10 text-rust" />
      <p className="font-heading tracking-wide text-foreground/90 leading-relaxed">
        You are authenticated, but not registered to command in this theater. The
        Security Office must add you to the roll before you may proceed.
      </p>
      <ul className="cq-panel border-border/60 text-left w-full px-4 py-3 space-y-1.5">
        {[
          "Confirm you signed in with the correct channel",
          "Request access from the app administrator",
          "Sign out and present another identity",
        ].map((line) => (
          <li key={line} className="flex gap-2.5 font-mono text-[11px] text-muted-foreground tracking-wide">
            <span className="text-brass shrink-0">▸</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  </AuthScene>
);

export default UserNotRegisteredError;
