import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Store, ArrowRight, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Seller = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  ad_count: number;
};

const TopSellers = () => {
  const { data: sellers = [] } = useQuery({
    queryKey: ["top-sellers"],
    queryFn: async (): Promise<Seller[]> => {
      // Pick recent active ads and aggregate by user
      const { data } = await supabase
        .from("ads")
        .select("user_id")
        .eq("status", "active")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!data) return [];
      const counts = new Map<string, number>();
      for (const row of data as { user_id: string }[]) {
        counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1);
      }
      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);
      if (topIds.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", topIds);
      const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
      return topIds.map((id) => {
        const p: any = profMap.get(id);
        return {
          user_id: id,
          display_name: p?.display_name || "Trusted Seller",
          avatar_url: p?.avatar_url || null,
          ad_count: counts.get(id) || 0,
        };
      });
    },
    staleTime: 10 * 60 * 1000,
  });

  if (sellers.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Most active this week</p>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground">Top Sellers</h2>
            </div>
          </div>
          <Link to="/search" className="hidden text-base font-medium text-primary hover:underline sm:flex sm:items-center sm:gap-1.5">
            Explore <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:-mx-6 sm:px-6">
          <div className="flex gap-3 pb-2 sm:grid sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
            {sellers.map((s, i) => {
              const initials = (s.display_name || "S")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Link
                  key={s.user_id}
                  to={`/seller/${s.user_id}`}
                  className="group flex w-[140px] shrink-0 flex-col items-center rounded-2xl border border-border/60 bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:w-auto"
                >
                  <div className="relative mb-2">
                    {s.avatar_url ? (
                      <img
                        src={s.avatar_url}
                        alt={s.display_name || "Seller"}
                        loading="lazy"
                        className="h-16 w-16 rounded-full border-2 border-primary/20 object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-base font-bold text-primary-foreground">
                        {initials}
                      </div>
                    )}
                    {i < 3 && (
                      <span className="absolute -top-1 -right-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 shadow">
                        #{i + 1}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{s.display_name}</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                    <BadgeCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    {s.ad_count} ads
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopSellers;
