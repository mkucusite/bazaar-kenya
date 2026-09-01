import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, MapPin, Flag, Rocket } from "lucide-react";
import politicians from "@/data/politicians.json";
import { buildPoliticianCampaignKeywords, matchesPoliticianSearch } from "@/lib/politician-seo";
import PoliticianPortrait from "@/components/politics/PoliticianPortrait";
import { getAccuratePoliticianProfile } from "@/lib/politician-profile";

const accuratePoliticians = (politicians as any[]).map(getAccuratePoliticianProfile);
type Politician = typeof accuratePoliticians[number];

const PAGE_SIZE = 60;

const PoliticiansPage = () => {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [pos, setPos] = useState(params.get("position") || "all");
  const [county, setCounty] = useState(params.get("county") || "all");
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = params.get("county");
    const pp = params.get("position");
    if (c) setCounty(c);
    if (pp) setPos(pp);
  }, [params]);

  const positions = useMemo(() => {
    const s = new Set<string>();
    accuratePoliticians.forEach((p) => p.position && s.add(p.position));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const counties = useMemo(() => {
    const s = new Set<string>();
    accuratePoliticians.forEach((p: any) => p.county && s.add(p.county));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (accuratePoliticians as Politician[]).filter((p: any) => {
      if (pos !== "all" && p.position !== pos) return false;
      if (county !== "all" && (p.county !== county && p.region !== county)) return false;
      if (!ql) return true;
      return matchesPoliticianSearch(p, ql);
    });
  }, [q, pos, county]);

  const pageItems = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = pageItems.length < filtered.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setPage((n) => n + 1);
    }, { rootMargin: "700px 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, filtered.length]);

  const onCountyChange = (c: string) => {
    setCounty(c);
    setPage(1);
    if (c === "all") params.delete("county"); else params.set("county", c);
    setParams(params, { replace: true });
  };

  const onPosChange = (p: string) => {
    setPos(p);
    setPage(1);
    if (p === "all") params.delete("position"); else params.set("position", p);
    setParams(params, { replace: true });
  };

  // Dynamic SEO
  const posLabel = pos === "all" ? "" : pos;
  const countyLabel = county === "all" ? "" : county;
  const seoTitle = posLabel && countyLabel
    ? `${posLabel} Aspirants ${countyLabel} 2027 — Campaigns, Profiles & Boost | KenyaAdverts`
    : countyLabel
      ? `${countyLabel} Politicians 2027 — Governor, Senator, MP, Women Rep, MCA Aspirants`
      : posLabel
        ? `${posLabel} Aspirants Kenya 2027 — All 47 Counties | KenyaAdverts`
        : "Kenya Politicians 2027 — Aspirants by County, Party & Position";
  const seoDesc = posLabel && countyLabel
    ? `Browse ${filtered.length} ${posLabel.toLowerCase()} aspirants and campaign profiles for ${countyLabel} County in Kenya's 2027 General Election. Boost your campaign, claim your profile, and reach voters directly.`
    : countyLabel
      ? `${filtered.length}+ declared aspirants for ${countyLabel} County 2027 — governors, senators, MPs, women reps and MCAs. Compare profiles, boost campaigns, post adverts.`
      : posLabel
        ? `${filtered.length}+ ${posLabel.toLowerCase()} aspirants across all 47 counties in Kenya for the 2027 General Election. Profiles, parties, claim & boost campaigns.`
        : `${accuratePoliticians.length}+ Kenyan political profiles across 47 counties. Filter by position, party and county.`;
  const canonicalQuery = [
    countyLabel && `county=${encodeURIComponent(countyLabel)}`,
    posLabel && `position=${encodeURIComponent(posLabel)}`,
  ].filter(Boolean).join("&");
  const canonical = `https://www.kenyaadverts.com/politicians${canonicalQuery ? `?${canonicalQuery}` : ""}`;
  const keywords = [
    posLabel && countyLabel && `${posLabel} aspirants ${countyLabel}`,
    posLabel && countyLabel && `${posLabel} campaign ${countyLabel} 2027`,
    countyLabel && `${countyLabel} politicians 2027`,
    countyLabel && `${countyLabel} governor 2027`,
    countyLabel && `${countyLabel} senator 2027`,
    countyLabel && `${countyLabel} MP 2027`,
    posLabel && `${posLabel} aspirants Kenya 2027`,
    "Kenya politicians 2027",
    "Kenya elections 2027",
    "campaign ads Kenya",
  ].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={canonical}
        keywords={keywords}
      />
      <Navbar />

      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            {posLabel && countyLabel
              ? <>{posLabel} Aspirants — <span className="text-primary">{countyLabel} 2027</span></>
              : countyLabel
                ? <>{countyLabel} Politicians <span className="text-primary">2027</span></>
                : posLabel
                  ? <>{posLabel} Aspirants <span className="text-primary">Kenya 2027</span></>
                  : <>Kenya 2027 Aspirants <span className="text-primary">Hub</span></>}
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            {filtered.length}+ {posLabel ? posLabel.toLowerCase() + " " : ""}aspirants{countyLabel ? ` in ${countyLabel} County` : " across the 47 counties"}. Search by name, party, county, “vote” phrases, campaign keywords, or position.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search vote Aaron, governor Kericho, party…" className="pl-9" />
            </div>
            <select value={county} onChange={(e) => onCountyChange(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {counties.map((c) => <option key={c} value={c}>{c === "all" ? "All counties" : c}</option>)}
            </select>
            <select value={pos} onChange={(e) => onPosChange(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {positions.map((p) => <option key={p} value={p}>{p === "all" ? "All positions" : p}</option>)}
            </select>
          </div>
        </div>
      </section>

      <main className="container-app pb-28 pt-6 md:py-8">
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
            {hasMore && (
              <div ref={sentinelRef} className="mt-8 text-center">
                <Button variant="outline" onClick={() => setPage((n) => n + 1)}>Load more politicians</Button>
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
  const campaignKeywords = buildPoliticianCampaignKeywords(p, 4).filter((k) => k.toLowerCase() !== p.name.toLowerCase());
  return (
    <Link
      to={`/politicians/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        <PoliticianPortrait name={p.name} photo={p.photo} imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
        <div className="mt-1 flex flex-wrap gap-1">
          {campaignKeywords.slice(0, 2).map((keyword) => (
            <span key={keyword} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary line-clamp-1">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default PoliticiansPage;
