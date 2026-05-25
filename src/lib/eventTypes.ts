export const EVENT_TYPES = [
  "Concert",
  "Conference",
  "Festival",
  "Sports",
  "Networking",
  "Religious",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export function timeUntil(dateISO: string): string {
  const target = new Date(dateISO).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    const ago = Math.abs(diff);
    const days = Math.floor(ago / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d ago`;
    const hrs = Math.floor(ago / (1000 * 60 * 60));
    if (hrs > 0) return `${hrs}h ago`;
    return "Happening now";
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 1) return days === 1 ? "Tomorrow" : `${days} days away`;
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  if (hrs >= 1) return `${hrs}h away`;
  const mins = Math.max(1, Math.floor(diff / (1000 * 60)));
  return `${mins}m away`;
}
