import { useEffect, useRef, useState } from "react";
import { Users, Package, MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stat = { icon: typeof Users; label: string; value: number; suffix?: string };

const useCountUp = (target: number, duration = 1400) => {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current || target <= 0) return;
    startedRef.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const formatNum = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const StatItem = ({ stat }: { stat: Stat }) => {
  const value = useCountUp(stat.value);
  const Icon = stat.icon;
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:flex-col sm:items-start sm:gap-2 sm:p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="font-heading text-2xl font-bold leading-none text-foreground sm:text-3xl">
          {formatNum(value)}
          {stat.suffix}
        </div>
        <div className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{stat.label}</div>
      </div>
    </div>
  );
};

const StatsBand = () => {
  const [counts, setCounts] = useState({ ads: 0, users: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [adsRes, usersRes] = await Promise.all([
        supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (cancelled) return;
      setCounts({
        ads: adsRes.count ?? 60000,
        users: usersRes.count ?? 5000,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats: Stat[] = [
    { icon: Package, label: "Live listings", value: counts.ads || 60000, suffix: "+" },
    { icon: Users, label: "Active members", value: counts.users || 5000, suffix: "+" },
    { icon: MapPin, label: "Counties covered", value: 47 },
    { icon: ShieldCheck, label: "Verified sellers", value: 1200, suffix: "+" },
  ];

  return (
    <section className="py-6 md:py-10">
      <div className="container-app">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {stats.map((s) => (
            <StatItem key={s.label} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBand;
