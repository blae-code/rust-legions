import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useUser from "@/hooks/useUser";

// The only identity we ever display is the commander's chosen callsign — never a name or email.
export default function useCallsign() {
  const { user } = useUser();
  const [callsign, setCallsign] = useState(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.UserProfile.filter({ created_by_id: user.id })
      .then((p) => setCallsign(p[0]?.displayName || null))
      .catch(() => setCallsign(null));
  }, [user?.id]);

  return callsign;
}