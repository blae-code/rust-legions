import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";

const HEARTBEAT_MS = 60 * 1000;

// Keeps the commander's own profile stamped as live and lets them choose how to appear.
export default function usePresence() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let timer;
    let cancelled = false;

    const beat = (p) => {
      if (!p) return;
      base44.entities.UserProfile.update(p.id, { lastSeenAt: new Date().toISOString() }).catch(() => {});
    };

    base44.entities.UserProfile.filter({ created_by_id: user.id }).then((rows) => {
      if (cancelled) return;
      const p = rows[0] || null;
      profileRef.current = p;
      setProfile(p);
      beat(p);
      timer = setInterval(() => beat(profileRef.current), HEARTBEAT_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [user?.id]);

  const setPresence = useCallback(async (presence) => {
    const p = profileRef.current;
    if (!p) return;
    const updated = await base44.entities.UserProfile.update(p.id, { presence, lastSeenAt: new Date().toISOString() });
    profileRef.current = updated;
    setProfile(updated);
  }, []);

  return { profile, presence: profile?.presence || "on_duty", setPresence, userId: user?.id || null };
}