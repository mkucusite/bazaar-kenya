import { Link } from "react-router-dom";
import { useMemo } from "react";
import politicians from "@/data/politicians.json";
import { ChevronRight, BadgeCheck, MapPin } from "lucide-react";
import { getAccuratePoliticianProfile } from "@/lib/politician-profile";

type Politician = {
  slug: string;
  name: string;
  photo?: string;
  county?: string;
  position?: string;
  party_abbr?: string;
  verified?: boolean;
  featured?: boolean;
};

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

const PoliticiansSpotlight = () => {
  const list = useMemo(() => {
    const all = ((politicians as Politician[]) || []).map(getAccuratePoliticianProfile);
    // Prioritize featured/verified, then shuffle for freshness
    const score = (p: Politician) => (p.featured ? 2 : 0) + (p.verified ? 1 : 0);
    const sorted = [...all].sort((a, b) => score(b) - score(a) + (Math.random() - 0.5) * 0.1);
    return sorted.slice(0, 12);
  }, []);

  if (!list.length) return null;

  return (
    <section className="section-padding bg-gradient-to-br from-primary/5 via-background to-amber-50/40">
      <div className="container-app">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-bold flex items-center gap-2">
              🗳️ Politicians & Aspirants 2027
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse profiles, follow campaigns, vote 2027 — across all 47 counties.
            </p>
          </div>
          <Link
            to="/politicians"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {list.map((p) => (
            <Link
              key={p.slug}
              to={`/politicians/${p.slug}`}
              className="group bg-card rounded-xl overflow-hidden border hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                {p.photo ? (
                  <img
                    src={p.photo}
                    alt={`${p.name} - ${p.position || ""} ${p.county || ""} - Vote 2027`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-primary/60 bg-primary/10">
                    {initials(p.name)}
                  </div>
                )}
                {p.verified && (
                  <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full p-0.5">
                    <BadgeCheck className="h-3.5 w-3.5" />
                  </span>
                )}
                {p.party_abbr && (
                  <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {p.party_abbr}
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="font-semibold text-sm truncate group-hover:text-primary">
                  {p.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {p.position || "Aspirant"}
                </div>
                {p.county && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-0.5 truncate">
                    <MapPin className="h-3 w-3" /> {p.county}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <Link
            to="/politicians"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            View all politicians <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PoliticiansSpotlight;
