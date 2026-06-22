import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, MapPin, Flag, Rocket } from "lucide-react";
import politicians from "@/data/politicians.json";

type Politician = typeof politicians[number];

const PAGE_SIZE = 60;

const PoliticiansPage = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("all");
  const [county, setCounty] = useState(params.get("county") || "all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const c = params.get("county");
    if (c) setCounty(c);
  }, [params]);

  const positions = useMemo(() => {
    const s = new Set<string>();
    politicians.forEach((p) => p.position && s.add(p.position));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const counties = useMemo(() => {
    const s = new Set<string>();
    politicians.forEach((p: any) => p.county && s.add(p.county));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (politicians as Politician[]).filter((p: any) => {
      if (pos !== "all" && p.position !== pos) return false;
      if (county !== "all" && p.county !== county) return false;
      if (!ql) return true;
      return [p.name, p.region, p.county, p.party_name, p.position, p.tagline]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(ql));
    });
  }, [q, pos, county]);

  const pageItems = filtered.slice(0, page * PAGE_SIZE);

  const onCountyChange = (c: string) => {
    setCounty(c);
    setPage(1);
    if (c === "all") params.delete("county"); else params.set("county", c);
    setParams(params, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kenya Politicians 2027 — Aspirants by County, Party & Position"
        description="252+ declared aspirants for Kenya's 2027 General Election. Filter governors, senators, MPs, woman reps and MCAs by county and party. Claim your profile and boost your campaign."
        canonical="https://www.kenyaadverts.com/politicians"
        keywords="Kenya politicians 2027, Kenya aspirants 2027, governor aspirants Kenya, senator aspirants Kenya, MP aspirants Kenya, MCA aspirants Kenya, campaign ads Kenya"
      />
      <Navbar />

      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Kenya 2027 Aspirants <span className="text-primary">Hub</span>
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {politicians.length}+ declared aspirants across the 47 counties. Search, filter and claim your profile to launch campaign adverts directly to voters in your ward.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search politicians, parties, wards…" className="pl-9" />
            </div>
            <select value={county} onChange={(e) => onCountyChange(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {counties.map((c) => <option key={c} value={c}>{c === "all" ? "All counties" : c}</option>)}
            </select>
            <select value={pos} onChange={(e) => { setPos(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {positions.map((p) => <option key={p} value={p}>{p === "all" ? "All positions" : p}</option>)}
            </select>
          </div>
        </div>
      </section>

      <main className="container-app py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{filtered.length} aspirants found</p>
          <Button asChild size="sm" className="gap-1.5"><Link to="/politics/new"><Rocket className="h-3.5 w-3.5" />Boost a campaign</Link></Button>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">No aspirants match your filters.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pageItems.map((p) => <PoliticianCard key={p.slug} p={p} />)}
            </div>
            {pageItems.length < filtered.length && (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setPage((n) => n + 1)}>Load more</Button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

const PoliticianCard = ({ p }: { p: any }) => {
  const initials = p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link
      to={`/politicians/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {p.photo ? (
          <img src={p.photo} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-black text-primary/40">{initials}</div>
        )}
        {p.verified && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            <ShieldCheck className="h-3 w-3" />Claimed
          </span>
        )}
        {p.party_abbr && (
          <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">{p.party_abbr}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</h3>
        {p.position && <p className="text-xs font-medium text-primary">{p.position}</p>}
        {p.region && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{p.region}</p>
        )}
        {p.party_name && (
          <p className="line-clamp-1 text-[11px] text-muted-foreground flex items-center gap-1"><Flag className="h-3 w-3" />{p.party_name}</p>
        )}
      </div>
    </Link>
  );
};

export default PoliticiansPage;
