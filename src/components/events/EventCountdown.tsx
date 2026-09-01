import { useEffect, useMemo, useState } from "react";

type Props = { startAt: string; endAt?: string | null; compact?: boolean };

export default function EventCountdown({ startAt, endAt, compact = false }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const start = new Date(startAt).getTime();
    const end = endAt ? new Date(endAt).getTime() : start + 3 * 60 * 60 * 1000;
    if (now >= end) return { state: "Ended", label: "Ended" };
    if (now >= start) return { state: "Live", label: "Live now" };
    const distance = Math.max(0, start - now);
    const days = Math.floor(distance / 86_400_000);
    const hours = Math.floor((distance % 86_400_000) / 3_600_000);
    const minutes = Math.floor((distance % 3_600_000) / 60_000);
    const seconds = Math.floor((distance % 60_000) / 1000);
    return {
      state: "Upcoming",
      label: days > 0 ? `${days}d ${hours}h ${minutes}m ${seconds}s` : `${hours}h ${minutes}m ${seconds}s`,
    };
  }, [startAt, endAt, now]);

  return (
    <span className={compact ? "tabular-nums" : "font-bold tabular-nums"} aria-label={`${countdown.state}: ${countdown.label}`}>
      {countdown.label}
    </span>
  );
}