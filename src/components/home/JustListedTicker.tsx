import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";

type Item = { id: string; title: string; price: number | null; slug?: string | null };

const JustListedTicker = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ads")
        .select("id,title,price,slug")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!cancelled && data) setItems(data as Item[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;
  // Duplicate for seamless marquee
  const loop = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-border/60 bg-gradient-to-r from-primary/5 via-card to-primary/5">
      <div className="container-app flex items-center gap-3 py-2">
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          <Sparkles className="h-3 w-3" /> Just Listed
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div className="flex animate-[ticker_60s_linear_infinite] gap-8 whitespace-nowrap">
            {loop.map((item, i) => (
              <Link
                key={`${item.id}-${i}`}
                to={getAdPath({ id: item.id, title: item.title, slug: item.slug || undefined })}
                className="text-xs text-foreground/80 hover:text-primary transition-colors"
              >
                <span className="font-medium">{item.title}</span>
                {item.price && item.price > 0 && (
                  <span className="ml-2 font-bold text-primary">KSh {Number(item.price).toLocaleString()}</span>
                )}
                <span className="mx-3 text-muted-foreground/40">•</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default JustListedTicker;
