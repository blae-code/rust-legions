import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import useUser from "@/hooks/useUser";
import { Shield } from "lucide-react";
import MusicController from "@/components/audio/MusicController";
import LogoutButton from "@/components/auth/LogoutButton";

const NAV = [
  { to: "/", label: "Command HQ" },
  { to: "/new-game", label: "New Game" },
  { to: "/faction-builder", label: "Faction Builder" },
  { to: "/leaderboard", label: "Roll of Honour" },
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

  // Identity comes from the signed-in Google account.
  const commander = (user?.full_name || user?.email || "").split(" ")[0] || "UNSIGNED";

  // The command HQ is a full-screen game menu — no web chrome there
  const isMenu = location.pathname === "/";
  // The command HQ carries its own audio controls in the HUD's top-right corner
  if (isMenu) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <MusicController />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm cq-metal">
        <div className="cq-hazard" />
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="group flex items-center gap-2 text-brass font-display text-xl tracking-[0.2em] uppercase transition-colors hover:text-brass-bright">
            <Shield className="w-5 h-5 transition-transform group-hover:scale-110" /> Rust Legions
          </Link>
          <span className="cq-tag border-rust/60 text-rust whitespace-nowrap hidden md:inline-flex" title="This game is under active development">⚠ Dev Build</span>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`relative px-3 py-1.5 text-xs font-heading uppercase tracking-[0.2em] rounded-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    active
                      ? "bg-brass/15 text-brass-bright"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-brass cq-lamp text-brass shrink-0" />}
                  {n.label}
                  {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-brass" />}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto items-center gap-2 hidden sm:flex">
            <span className="w-1.5 h-1.5 rounded-full bg-olive cq-lamp text-olive" />
            <span className="text-xs font-mono text-muted-foreground truncate">CMDR {commander.toUpperCase()}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main key={location.pathname} className="cq-page-in max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 pb-4">
        <p className="font-mono text-[9px] text-muted-foreground/50 tracking-[0.3em] text-center border-t border-border/50 pt-3">
          MINISTRY OF WAR · FIELD TERMINAL 7-A · ALL TRANSMISSIONS MONITORED
        </p>
      </footer>
    </div>
  );
}