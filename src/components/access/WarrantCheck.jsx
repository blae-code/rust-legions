import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthBooting from "@/components/auth/AuthBooting";
import Muster from "@/pages/Muster";
import { getWarrant, clearWarrant } from "@/lib/warrant";

// The checkpoint. A warrant held on this terminal is the whole commission —
// High Command may also pass on a signed-in admin session.
export default function WarrantCheck() {
  const [state, setState] = useState(null); // { granted, revoked }

  const check = useCallback(async () => {
    const held = getWarrant();
    if (held?.code) {
      try {
        const res = await base44.functions.invoke("enlistmentCodes", { action: "verify", code: held.code });
        if (res.data?.granted) {
          setState({ granted: true, revoked: false });
          return;
        }
        clearWarrant();
        setState({ granted: false, revoked: !!res.data?.revoked });
        return;
      } catch {
        setState({ granted: false, revoked: false });
        return;
      }
    }

    // No warrant on this terminal — an admin session still gets through
    try {
      const user = await base44.auth.me();
      setState({ granted: user?.role === "admin", revoked: false });
    } catch {
      setState({ granted: false, revoked: false });
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  if (!state) return <AuthBooting />;
  if (!state.granted) return <Muster revoked={state.revoked} onMustered={check} />;
  return <Outlet />;
}