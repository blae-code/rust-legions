import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { playSfx } from "@/lib/sfx";

// Shared, diegetic form controls for the auth terminal. Every surface (login,
// register, reset) composes these so the whole flow stays one visual system.

// A labelled input dressed as a ministry field — stencil label, mono clarifier,
// brass focus glow. Forwards every native prop straight to <input>.
export function AuthField({ label, hint, icon: Icon, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="cq-label flex items-baseline gap-2 mb-1.5">
        {label}
        {hint && <span className="text-[8px] tracking-[0.25em] text-muted-foreground/50">{hint}</span>}
      </label>
      <div className="flex items-center gap-2.5 border border-input bg-background/50 rounded-sm px-3 transition-colors focus-within:border-brass/70 focus-within:bg-background/75">
        {Icon && <Icon className="w-4 h-4 text-brass/70 shrink-0" />}
        <input
          {...props}
          className="w-full bg-transparent py-2.5 font-heading tracking-wide text-base text-foreground outline-none placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

// The primary action — a worn brass plate that clicks when pressed.
export function AuthSubmit({ loading, children, loadingLabel = "Working…", ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      onMouseDown={() => playSfx("build")}
      {...props}
      className="cq-metal w-full bg-primary text-primary-foreground border border-brass-bright/40 font-heading uppercase tracking-[0.22em] text-sm py-3 rounded-sm hover:bg-brass-bright disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Provider sign-in (Google) — a neutral metal plate, kept recognisable.
export function ProviderButton({ onClick, children = "Continue with Google" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => playSfx("build")}
      className="cq-metal w-full border border-border font-heading uppercase tracking-[0.15em] text-xs sm:text-sm py-3 rounded-sm text-foreground hover:border-brass/50 transition-colors flex items-center justify-center gap-2.5"
    >
      <GoogleIcon className="w-5 h-5" />
      {children}
    </button>
  );
}

// Diegetic error plate — the terminal rejects the transmission.
export function AuthError({ children }) {
  if (!children) return null;
  return (
    <div className="cq-warning-edge cq-panel border-rust/50 flex items-center gap-2.5 pl-4 pr-3 py-2.5 mb-4">
      <AlertTriangle className="w-4 h-4 text-rust shrink-0" />
      <p className="font-mono text-[11px] text-rust/90 tracking-wide leading-snug">{children}</p>
    </div>
  );
}

// Stencilled "or" rule between provider and manual credentials.
export function AuthDivider({ label = "or present credentials" }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="cq-label bg-card px-3 text-[9px]">{label}</span>
      </div>
    </div>
  );
}
