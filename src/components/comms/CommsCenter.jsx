import React, { useState } from "react";
import { Radio, X } from "lucide-react";
import usePresence from "@/hooks/usePresence";
import useComms from "@/hooks/useComms";
import PresenceSelector from "@/components/comms/PresenceSelector";
import CommanderRoster from "@/components/comms/CommanderRoster";
import DispatchInbox from "@/components/comms/DispatchInbox";
import InviteInbox from "@/components/comms/InviteInbox";
import { playSfx } from "@/lib/sfx";

const TABS = [
  { id: "wire", label: "Wire" },
  { id: "summons", label: "Summons" },
  { id: "roll", label: "Roll" },
];

// The Signals Office — presence, dispatches and lobby summons in one terminal.
export default function CommsCenter() {
  const { profile, presence, setPresence, userId } = usePresence();
  const { dispatches, invites, unread, refresh } = useComms(userId);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("wire");
  const [target, setTarget] = useState(null);

  const messageCommander = (p) => {
    setTarget(p);
    setTab("wire");
  };

  return (
    <div className="relative">
      <button
        onClick={() => { playSfx("select"); setOpen((o) => !o); }}
        title="Signals Office — dispatches & summons"
        className="cq-metal relative flex items-center justify-center w-8 h-8 rounded-sm border border-border text-muted-foreground hover:text-brass hover:border-brass/60 transition-colors"
      >
        <Radio className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-[3px] rounded-full bg-rust text-[9px] font-mono leading-[14px] text-primary-foreground">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-[300px] cq-panel p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="cq-label text-brass">Signals Office</p>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-rust"><X className="w-3.5 h-3.5" /></button>
          </div>

          <PresenceSelector presence={presence} onChange={setPresence} />

          <div className="flex gap-1 border-b border-border pb-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2 py-0.5 rounded-sm font-heading uppercase tracking-widest text-[10px] transition-colors ${
                  tab === t.id ? "bg-brass/15 text-brass-bright" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {t.id === "summons" && invites.length > 0 && ` (${invites.length})`}
              </button>
            ))}
          </div>

          <div className="max-h-[46vh] overflow-y-auto pr-1">
            {tab === "wire" && (
              <DispatchInbox
                dispatches={dispatches}
                target={target}
                myCallsign={profile?.displayName}
                onClearTarget={() => setTarget(null)}
                onRefresh={refresh}
              />
            )}
            {tab === "summons" && <InviteInbox invites={invites} onRefresh={refresh} onClose={() => setOpen(false)} />}
            {tab === "roll" && <CommanderRoster myUserId={userId} onMessage={messageCommander} />}
          </div>
        </div>
      )}
    </div>
  );
}