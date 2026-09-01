// How a commander chooses to appear on the Ministry roll.
export const PRESENCE_OPTIONS = [
  { id: "on_duty", label: "On Duty", hint: "Listed and open to summons", dot: "bg-olive", text: "text-olive" },
  { id: "reserve", label: "In Reserve", hint: "Listed, but marked away", dot: "bg-brass", text: "text-brass" },
  { id: "dark", label: "Gone Dark", hint: "Hidden from the roll entirely", dot: "bg-muted-foreground", text: "text-muted-foreground" },
];

export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

export function presenceMeta(id) {
  return PRESENCE_OPTIONS.find((p) => p.id === id) || PRESENCE_OPTIONS[0];
}

// Live = has pinged the terminal recently and hasn't gone dark.
export function isLive(profile) {
  if (!profile || profile.presence === "dark") return false;
  if (!profile.lastSeenAt) return false;
  return Date.now() - new Date(profile.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
}

// Reachable for invites — on duty and live.
export function isReachable(profile) {
  return isLive(profile) && (profile.presence || "on_duty") === "on_duty";
}