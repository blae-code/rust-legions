import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const HERO_IMG = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/ca29f8b58_generated_image.png";

const NAV = [
  { to: "/", label: "Command HQ" },
  { to: "/new-game", label: "New Game" },
  { to: "/faction-builder", label: "Faction Builder" },
  { to: "/maps", label: "Map Library" },
  { to: "/map-editor", label: "Map Editor" },
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
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        <div className="relative max-w-md w-full text-center cq-panel p-10">
          <div className="cq-hazard absolute top-0 left-0 right-0 rounded-t" />
          <Shield className="w-12 h-12 mx-auto text-brass mb-4" />
          <h1 className="cq-display text-4xl mb-1">Conquest Tactics</h1>
          <p className="text-muted-foreground mb-6 font-heading tracking-wide">Enlist to command your faction on the front.</p>
          <Button
            className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading tracking-[0.2em] uppercase w-full"
            onClick={() => base44.auth.redirectToLogin(location.pathname)}
          >
            Report for Duty
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="cq-hazard" />
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-brass font-display text-xl tracking-[0.2em] uppercase">
            <Shield className="w-5 h-5" /> Conquest
          </Link>
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