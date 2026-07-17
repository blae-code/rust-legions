import React from "react";
import { Link, Outlet, Navigate, useLocation } from "react-router-dom";
import useUser from "@/hooks/useUser";
import { Shield } from "lucide-react";
import MusicController from "@/components/audio/MusicController";

const NAV = [
  { to: "/", label: "Command HQ" },
  { to: "/new-game", label: "New Game" },
  { to: "/faction-builder", label: "Faction Builder" },
  { to: "/maps", label: "Map Library" },
  { to: "/map-editor", label: "Map Editor" },
  { to: "/field-manual", label: "Field Manual" },
];

export default function Layout() {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // App-level routing normally redirects unauthenticated users to /login before
    // Layout mounts; this is a belt-and-braces fallback that stays in-repo.
    return <Navigate to="/login" replace />;
  }

  // The command HQ is a full-screen game menu — no web chrome there
  const isMenu = location.pathname === "/";
  // The command HQ carries its own audio controls in the HUD's top-right corner
  if (isMenu) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <MusicController />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="cq-hazard" />
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-brass font-display text-xl tracking-[0.2em] uppercase">
            <Shield className="w-5 h-5" /> Rust Legions
          </Link>
          <span className="cq-tag border-rust/60 text-rust whitespace-nowrap hidden md:inline-flex" title="This game is under active development">⚠ Dev Build</span>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 text-xs font-heading uppercase tracking-[0.2em] rounded-sm whitespace-nowrap transition-colors ${
                  location.pathname === n.to
                    ? "bg-brass/15 text-brass-bright border-b-2 border-brass"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-xs font-mono text-muted-foreground truncate hidden sm:block">{user.full_name || user.email}</div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}