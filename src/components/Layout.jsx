import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

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
      <div className="fixed inset-0 flex items-center justify-center bg-[#100D0A]">
        <div className="w-8 h-8 border-4 border-stone-700 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#100D0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center border border-stone-800 bg-[#1C1714] p-10 rounded-lg">
          <Shield className="w-12 h-12 mx-auto text-amber-600 mb-4" />
          <h1 className="text-3xl font-bold tracking-widest text-stone-100 uppercase mb-2">Conquest</h1>
          <p className="text-stone-400 mb-6">Enlist to command your faction on the front.</p>
          <Button
            className="bg-amber-700 hover:bg-amber-600 text-stone-100 tracking-wider uppercase"
            onClick={() => base44.auth.redirectToLogin(location.pathname)}
          >
            Report for Duty
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#100D0A] text-stone-200">
      <header className="border-b border-stone-800 bg-[#1C1714]/95 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-amber-500 font-bold tracking-widest uppercase">
            <Shield className="w-5 h-5" /> Conquest
          </Link>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 text-xs uppercase tracking-wider rounded whitespace-nowrap ${
                  location.pathname === n.to ? "bg-amber-900/40 text-amber-400" : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-xs text-stone-500 truncate hidden sm:block">{user.full_name || user.email}</div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}