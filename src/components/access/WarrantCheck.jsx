import React, { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AuthBooting from "@/components/auth/AuthBooting";
import WarrantGate from "@/components/access/WarrantGate";

// Layout route: every authenticated commander must hold a valid warrant to pass.
export default function WarrantCheck() {
  const [state, setState] = useState(null); // { granted, revoked }

  const check = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("enlistmentCodes", { action: "status" });
      setState({ granted: !!res.data?.granted, revoked: !!res.data?.revoked });
    } catch {
      setState({ granted: false, revoked: false });
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  if (!state) return <AuthBooting />;
  if (!state.granted) return <WarrantGate revoked={state.revoked} onGranted={check} />;
  return <Outlet />;
}