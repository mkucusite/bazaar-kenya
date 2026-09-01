import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, MapPin, Stethoscope, Code2, Sparkles, Briefcase, Hotel, Car, Palmtree,
  UtensilsCrossed, Scissors, GraduationCap, Dumbbell, Wrench, Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ALL_DIRECTORY_KINDS, DIRECTORY_KINDS, type DirectoryKind, directoryPath } from "@/lib/directory";
import { directoryVisibilityOr } from "@/lib/aiVisibility";

type Row = {
  id: string;
  kind: DirectoryKind;
  slug: string;
  name: string;
  headline: string | null;
  organisation: string | null;
  county: string | null;
  town: string | null;
  price: number | null;
  price_label: string | null;
  images: string[] | null;
  avatar_url: string | null;
  tags: string[] | null;
  is_verified: boolean;
};

export const DIRECTORY_ICONS: Record<string, typeof Stethoscope> = {
  doctor: Stethoscope,
  developer: Code2,
  wellness: Sparkles,
  job: Briefcase,
  hotel: Hotel,
  vehicle: Car,
  tour: Palmtree,
  restaurant: UtensilsCrossed,
  salon: Scissors,
  school: GraduationCap,
  fitness: Dumbbell,
  artisan: Wrench,
  "event-service": Camera,
};
const ICONS = DIRECTORY_ICONS;

export const DIRECTORY_ACCENT: Record<string, string> = {
  doctor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  developer: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  wellness: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  job: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  hotel: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  vehicle: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  tour: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  restaurant: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  salon: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  school: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  fitness: "bg-lime-500/10 text-lime-700 dark:text-lime-400",
  artisan: "bg-stone-500/10 text-stone-600 dark:text-stone-300",
  "event-service": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};
const ACCENT = DIRECTORY_ACCENT;

const DirectoryRails = ({ kinds, showEmptyCta = false }: { kinds?: DirectoryKind[]; showEmptyCta?: boolean }) => {
  const KIND_ORDER: DirectoryKind[] = kinds && kinds.length ? kinds : ALL_DIRECTORY_KINDS;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("directory_profiles" as any)
        .select("id,kind,slug,name,headline,organisation,county,town,price,price_label,images,avatar_url,tags,is_verified")
        .eq("is_published", true)
        .or(directoryVisibilityOr())
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(180);
      if (!active) return;
      setRows(((data as unknown as Row[]) || []));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  return (
    <>
      {KIND_ORDER.map((kind) => {
        const config = DIRECTORY_KINDS[kind];
        const items = rows.filter((r) => r.kind === kind).slice(0, 8);
        const Icon = ICONS[kind] || Sparkles;
        if (!config || (items.length === 0 && !showEmptyCta)) return null;

        return (
          <section key={kind} className="container-app py-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENT[kind]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">{config.label}</h2>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{config.tagline}</p>
              </div>
              <Link
                to={config.path}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 sm:text-sm"
              >
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {items.length === 0 ? (
              <Link
                to={`${config.path}/new`}
                className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border bg-card/60 p-5 transition-colors hover:border-primary/50"
              >
                <span className="text-sm font-semibold text-foreground">{config.ctaPost}</span>
                <span className="text-xs text-muted-foreground">
                  Be the first here — free to publish, live instantly and indexed on Google.
                </span>
              </Link>
            ) : (
              <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
                {items.map((item) => {
                  const image = item.images?.[0] || item.avatar_url;
                  return (
                    <Link
                      key={item.id}
                      to={directoryPath(kind, item.slug)}
                      className="w-[78%] shrink-0 snap-start rounded-2xl border border-border/60 bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:w-auto"
                    >
                      <div className="flex items-start gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={item.name}
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${ACCENT[kind]}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {item.headline || item.organisation || config.singular}
                          </p>
                          {(item.county || item.town) && (
                            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {item.town ? `${item.town}, ${item.county}` : item.county}
                            </p>
                          )}
                        </div>
                      </div>
                      {(item.tags?.length || item.price) && (
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] text-muted-foreground">
                            {item.tags?.slice(0, 2).join(" • ")}
                          </span>
                          {item.price ? (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              KSh {Number(item.price).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
};

export default DirectoryRails;
