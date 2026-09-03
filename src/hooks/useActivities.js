import { useCallback, useEffect, useRef, useState } from "react";
import { ACTIVITIES } from "@/lib/tactical/activities";
import { playActivity } from "@/lib/tactical/activitySfx";

/**
 * Holds the transient activity state of every stand on the board.
 *
 * An activity is deliberately short-lived: the counter itself never animates,
 * so the badge plus its sound cue IS the feedback, and both clear themselves
 * after the activity's authored duration. Re-issuing to the same stand resets
 * its timer rather than stacking a second badge.
 */
export default function useActivities() {
  const [acts, setActs] = useState({});
  const timers = useRef({});

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  const issue = useCallback((standId, key) => {
    const spec = ACTIVITIES[key];
    if (!spec) return;
    playActivity(key);
    setActs((a) => ({ ...a, [standId]: key }));
    clearTimeout(timers.current[standId]);
    timers.current[standId] = setTimeout(() => {
      setActs((a) => {
        const next = { ...a };
        delete next[standId];
        return next;
      });
    }, spec.ms);
  }, []);

  return { acts, issue };
}