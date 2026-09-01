import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const POLL_MS = 20000;

// The commander's wire traffic — dispatches received and lobby summons pending.
export default function useComms(userId) {
  const [dispatches, setDispatches] = useState([]);
  const [invites, setInvites] = useState([]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [msgs, inv] = await Promise.all([
      base44.entities.Dispatch.filter({ toUserId: userId }, "-created_date", 50),
      base44.entities.LobbyInvite.filter({ toUserId: userId, status: "pending" }, "-created_date", 25),
    ]);
    setDispatches(msgs);
    setInvites(inv);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [userId, refresh]);

  const unread = dispatches.filter((d) => !d.readAt).length + invites.length;

  return { dispatches, invites, unread, refresh };
}