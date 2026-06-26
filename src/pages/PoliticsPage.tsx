import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Vote, Plus, Search, Flag, Users, Building2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { optimizeImageUrl } from "@/lib/image-utils";
import politicians from "@/data/politicians.json";
import { politicianSearchText } from "@/lib/politician-seo";

type Party = {
  id: string;
  name: string;
  slug: string;
  abbreviation: string | null;
  color: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  is_verified: boolean;
};

type Candidate = {
  id: string;
  slug: string | null;
  business_name: string;
  banner_image: string;
  running_position: string | null;
  party_name: string | null;
  party_color: string | null;
  candidate_number: string | null;
  slogan: string | null;
  description?: string | null;
  manifesto_points?: string[] | null;
  likes_count?: number;
  votes_count?: number;
  promoted_until?: string | null;
  country?: string | null;
  county?: string | null;
};

type StaticPolitician = typeof politicians[number];

const KENYAN_COUNTIES = [
  "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir","Mandera",
  "Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua",
  "Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia",
  "Uasin Gishu","Elgeyo-Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado",
  "Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay",
  "Migori","Kisii","Nyamira","Nairobi",
];

const POSITIONS = [
  "President","Deputy President","Governor","Deputy Governor","Senator","Member of Parliament",
  "Woman Representative","Member of County Assembly (MCA)","Ward Representative","Party Leader","Other",
];

const COUNTRIES = ["Kenya","Uganda","Tanzania","Rwanda","Burundi","South Sudan","Ethiopia","Somalia"];

const PoliticsPage = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("Kenya");
  const [registerOpen, setRegisterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: pData }, { data: cData }] = await Promise.all([
        supabase.from("political_parties" as any).select("*").order("name"),
        supabase
          .from("banner_campaigns" as any)
          .select("id, slug, business_name, banner_image, description, running_position, party_name, party_color, candidate_number, slogan, manifesto_points, likes_count, votes_count, promoted_until, country, county")
          .eq("category", "politician")
          .eq("status", "active")
          .order("promoted_until", { ascending: false, nullsFirst: false })
          .order("likes_count", { ascending: false })
          .limit(500),
      ]);
      setParties((pData as any) || []);
      setCandidates((cData as any) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filteredParties = useMemo(
    () => parties.filter((p) => !((p as any).country) || (p as any).country === countryFilter),
    [parties, countryFilter]
  );

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesQ = !q ||
        c.business_name.toLowerCase().includes(q) ||
        (c.running_position || "").toLowerCase().includes(q) ||
        (c.party_name || "").toLowerCase().includes(q);
      const matchesParty = partyFilter === "all" ||
        (partyFilter === "independent" && !c.party_name) ||
        (c.party_name || "").toLowerCase() === partyFilter.toLowerCase();
      const matchesPos = positionFilter === "all" || (c.running_position || "").toLowerCase().includes(positionFilter.toLowerCase());
      const matchesCounty = countyFilter === "all" || (c.county || "").toLowerCase() === countyFilter.toLowerCase();
      const matchesCountry = !c.country || c.country === countryFilter;
      return matchesQ && matchesParty && matchesPos && matchesCounty && matchesCountry;
    });
  }, [candidates, search, partyFilter, positionFilter, countyFilter, countryFilter]);

  const filteredPoliticians = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (politicians as StaticPolitician[]).filter((p: any) => {
      const matchesQ = !q || [p.name, p.position, p.party_name, p.party_abbr, p.region, p.county, p.tagline, politicianSearchText(p)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesParty = partyFilter === "all" ||
        (partyFilter === "independent" && !p.party_name) ||
        (p.party_name || "").toLowerCase() === partyFilter.toLowerCase() ||
        (p.party_abbr || "").toLowerCase() === partyFilter.toLowerCase();
      const matchesPos = positionFilter === "all" || (p.position || "").toLowerCase().includes(positionFilter.toLowerCase());
      const matchesCounty = countyFilter === "all" || [p.county, p.region].filter(Boolean).some((place) => String(place).toLowerCase() === countyFilter.toLowerCase());
      return matchesQ && matchesParty && matchesPos && matchesCounty && countryFilter === "Kenya";
    });
  }, [search, partyFilter, positionFilter, countyFilter, countryFilter]);

  const candidatesByParty = useMemo(() => {
    const map = new Map<string, Candidate[]>();
    const partyByKey = parties.map(p => ({
      name: p.name,
      keys: [p.name.toLowerCase(), (p.abbreviation || "").toLowerCase()].filter(Boolean),
    }));
    candidates.forEach((c) => {
      const cn = (c.party_name || "").toLowerCase().trim();
      let matched: string | null = null;
      if (cn) {
        for (const p of partyByKey) {
          if (p.keys.some(k => cn === k || cn.includes(k) || k.includes(cn.split(/[\s—\-\/|]/)[0] || ""))) {
            matched = p.name;
            break;
          }
        }
      }
      const key = matched || c.party_name || "Independent";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return map;
  }, [candidates, parties]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Politics Kenya — Aspirants, Parties & Campaigns"
        description={`Browse ${candidates.length} Kenyan political aspirants and ${parties.length} registered parties. View manifestos, party affiliations and campaign banners across all 47 counties.`}
        canonical="https://www.kenyaadverts.com/politics"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              name: "Politics Kenya",
              description: "Kenyan political parties and aspirants directory",
              url: "https://www.kenyaadverts.com/politics",
            },
            {
              "@type": "ItemList",
              name: "Registered Political Parties",
              numberOfItems: parties.length,
              itemListElement: parties.slice(0, 50).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Organization",
                  name: p.name,
                  alternateName: p.abbreviation || undefined,
                  url: `https://www.kenyaadverts.com/politics#${p.slug}`,
                  logo: p.logo_url || undefined,
                  description: p.description || undefined,
                  sameAs: p.website ? [p.website] : undefined,
                },
              })),
            },
          ],
        }}
      />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "linear-gradient(135deg, hsl(120 60% 18%) 0%, hsl(120 50% 28%) 50%, hsl(45 90% 50%) 100%)" }}>
        <div className="container-app py-12 md:py-16 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Vote className="h-3.5 w-3.5" /> Kenya Politics Hub
          </div>
          <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
            Aspirants. Parties. Manifestos.
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm md:text-base text-white/90">
            Discover {politicians.length}+ politician profiles, campaign pages, parties and manifestos. Search vote keywords, county races and 2027 aspirants across Kenya.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-foreground hover:bg-white/90">
              <Link to="/politics/new">
                <Plus className="mr-2 h-4 w-4" /> Post a Campaign Banner
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/politicians">
                <Users className="mr-2 h-4 w-4" /> All Politicians
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" onClick={() => setRegisterOpen(true)}>
              <Building2 className="mr-2 h-4 w-4" /> Register a Party
            </Button>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-border bg-card">
        <div className="container-app grid grid-cols-3 divide-x divide-border">
          <StatBlock label="Profiles" value={politicians.length + candidates.length} />
          <StatBlock label="Parties" value={parties.length} />
          <StatBlock label="Promoted" value={candidates.filter(c => c.promoted_until && new Date(c.promoted_until) > new Date()).length} />
        </div>
      </section>

      {/* Auto-rotating slideshow of top aspirants */}
      {!loading && candidates.length > 0 && (
        <AspirantSlideshow
          candidates={[
            ...candidates.filter(c => c.promoted_until && new Date(c.promoted_until) > new Date()),
            ...candidates.filter(c => !(c.promoted_until && new Date(c.promoted_until) > new Date())),
          ].slice(0, 8)}
        />
      )}

      <main className="container-app py-8 md:py-10">
        <Tabs defaultValue="aspirants" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="aspirants"><Users className="h-4 w-4 mr-2" />Aspirants</TabsTrigger>
            <TabsTrigger value="parties"><Building2 className="h-4 w-4 mr-2" />Parties</TabsTrigger>
          </TabsList>

          {/* Aspirants */}
          <TabsContent value="aspirants" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="relative sm:col-span-2 lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vote Aaron, governor Kericho, party…"
                  className="pl-9"
                />
              </div>
              <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All positions</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={countyFilter} onChange={(e) => setCountyFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      disabled={countryFilter !== "Kenya"}>
                <option value="all">{countryFilter === "Kenya" ? "All counties" : "(Kenya only)"}</option>
                {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={partyFilter} onChange={(e) => setPartyFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2 lg:col-span-2">
                <option value="all">All parties</option>
                <option value="independent">Independent</option>
                {filteredParties.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold">All politician profiles</h2>
                  <p className="text-sm text-muted-foreground">{filteredPoliticians.length.toLocaleString()} searchable campaign profiles with vote, county, position and party keywords.</p>
                </div>
                <Button asChild variant="secondary" className="shrink-0"><Link to="/politicians">Open full directory</Link></Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredCandidates.length === 0 && filteredPoliticians.length === 0 ? (
              <Card className="p-10 text-center">
                <Vote className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold">No aspirants match these filters</p>
                <p className="text-sm text-muted-foreground">Try a different position, county or party — or be the first to publish here.</p>
                <Button asChild className="mt-4"><Link to="/politics/new">Post your campaign</Link></Button>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredCandidates.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Promoted campaign banners</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredCandidates.map((c) => (
                        <CandidateCard key={c.id} c={c} />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Politician profile directory</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {filteredPoliticians.slice(0, 60).map((p: any) => (
                      <StaticPoliticianCard key={p.slug} p={p} />
                    ))}
                  </div>
                  {filteredPoliticians.length > 60 && (
                    <div className="mt-5 text-center">
                      <Button asChild variant="outline"><Link to="/politicians">View all {filteredPoliticians.length.toLocaleString()} politicians</Link></Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Parties */}
          <TabsContent value="parties" className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-xs text-muted-foreground self-center">
                Showing parties registered in <strong>{countryFilter}</strong>.
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredParties.length === 0 ? (
              <Card className="p-10 text-center">
                <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-semibold">No parties registered for {countryFilter} yet</p>
                <p className="text-sm text-muted-foreground">Register your party to be listed here.</p>
                <Button className="mt-4" onClick={() => setRegisterOpen(true)}>Register a party</Button>
              </Card>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {filteredParties.map((p) => {
                  const count = candidatesByParty.get(p.name)?.length || 0;
                  return <PartyCard key={p.id} party={p} candidateCount={count} />;
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <RegisterPartyDialog open={registerOpen} onOpenChange={setRegisterOpen} onCreated={(p) => setParties((prev) => [...prev, p])} />

      <Footer />
    </div>
  );
};

const AspirantSlideshow = ({ candidates }: { candidates: Candidate[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || candidates.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % candidates.length), 4500);
    return () => window.clearInterval(t);
  }, [paused, candidates.length]);
  if (candidates.length === 0) return null;
  const c = candidates[index];
  const color = c.party_color || "hsl(var(--primary))";
  const isPromoted = c.promoted_until && new Date(c.promoted_until) > new Date();
  return (
    <section className="border-b border-border bg-card">
      <div className="container-app py-5 md:py-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground">Featured aspirants</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {candidates.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`}
              />
            ))}
          </div>
        </div>
        <Link
          to={`/politics/${c.slug || c.id}`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="group relative block overflow-hidden rounded-2xl border-2 shadow-xl"
          style={{ borderColor: color }}
        >
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-muted">
            <img
              key={c.id}
              src={optimizeImageUrl(c.banner_image, 1400)}
              alt={c.business_name}
              className="h-full w-full object-cover animate-in fade-in zoom-in-105 duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
            {isPromoted && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-lg">★ Promoted</span>
            )}
            <div className="absolute inset-y-0 left-0 flex w-full sm:w-3/5 flex-col justify-end p-4 sm:p-8 text-white">
              {c.party_name && (
                <span className="mb-2 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: color }}>
                  {c.party_name}
                </span>
              )}
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase leading-tight drop-shadow-2xl line-clamp-2">{c.business_name}</h3>
              {c.running_position && (
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-wider opacity-95">For {c.running_position}{c.county ? ` • ${c.county}` : ""}</p>
              )}
              {c.slogan && (
                <p className="mt-2 text-sm sm:text-base italic opacity-95 line-clamp-2">"{c.slogan}"</p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs sm:text-sm">
                {typeof c.likes_count === "number" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">♥ {c.likes_count.toLocaleString()}</span>
                )}
                {c.candidate_number && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold backdrop-blur">No. {c.candidate_number}</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

const StatBlock = ({ label, value }: { label: string; value: number }) => (
  <div className="py-4 text-center">
    <p className="text-2xl md:text-3xl font-black text-foreground">{value.toLocaleString()}</p>
    <p className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

const CandidateCard = ({ c }: { c: Candidate }) => {
  const color = c.party_color || "hsl(var(--primary))";
  const isPromoted = c.promoted_until && new Date(c.promoted_until) > new Date();
  const firstManifesto = Array.isArray(c.manifesto_points) && c.manifesto_points.length > 0 ? c.manifesto_points[0] : null;
  return (
    <Link to={`/politics/${c.slug || c.id}`} className="group block">
      <Card className="overflow-hidden border-2 transition-all hover:shadow-xl hover:-translate-y-0.5" style={{ borderColor: color }}>
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img
            src={optimizeImageUrl(c.banner_image, 600)}
            alt={c.business_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          {isPromoted && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">★ Promoted</span>
          )}
          {c.candidate_number && (
            <div className="absolute right-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 border-white bg-white shadow-lg">
              <span className="text-[8px] font-bold uppercase" style={{ color }}>No.</span>
              <span className="text-xl font-black leading-none text-foreground">{c.candidate_number}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="text-lg font-black uppercase leading-tight drop-shadow-lg line-clamp-2">{c.business_name}</h3>
            {c.running_position && <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider opacity-95">For {c.running_position}</p>}
            {c.slogan && <p className="mt-1 text-[11px] italic opacity-90 line-clamp-1">"{c.slogan}"</p>}
          </div>
        </div>
        {firstManifesto && (
          <div className="px-3 py-2 text-[11px] text-muted-foreground line-clamp-2 border-b border-border">
            <span className="font-bold text-foreground">Pledge: </span>{firstManifesto}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs" style={{ background: color, color: "white" }}>
          <span className="font-bold truncate">{c.party_name || "Independent"}</span>
          <span className="inline-flex items-center gap-2 shrink-0">
            {typeof c.likes_count === "number" && <span className="opacity-95">♥ {c.likes_count}</span>}
            <Vote className="h-3.5 w-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
};

const StaticPoliticianCard = ({ p }: { p: any }) => {
  const initials = p.name.split(" ").map((word: string) => word[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link to={`/politicians/${p.slug}`} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-primary/10">
        {p.photo ? (
          <img src={p.photo} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 text-3xl font-black text-primary/60">{initials}</div>
        )}
        {p.party_abbr && <span className="absolute left-2 top-2 rounded-md bg-card/90 px-2 py-0.5 text-[10px] font-bold text-foreground shadow">{p.party_abbr}</span>}
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">{p.name}</h3>
        <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-primary">{p.position || "Aspirant"}</p>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{p.region || p.county || "Kenya"}</p>
      </div>
    </Link>
  );
};

const PartyCard = ({ party, candidateCount }: { party: Party; candidateCount: number }) => {
  const color = party.color || "hsl(var(--primary))";
  const initials = (party.abbreviation || party.name).slice(0, 3).toUpperCase();
  return (
    <div id={party.slug} className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-xl hover:-translate-y-0.5">
      <meta itemProp="name" content={party.name} />
      {/* Color accent stripe */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white shadow-sm ring-2 ring-white/60"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            {party.logo_url ? (
              <img src={party.logo_url} alt={party.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <span className="text-sm font-black tracking-tight">{initials}</span>
            )}
            {party.is_verified && (
              <span className="absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full bg-blue-500 ring-2 ring-card">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-white"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-bold leading-tight text-foreground">{party.name}</h3>
            {party.abbreviation && (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{party.abbreviation}</p>
            )}
          </div>
        </div>

        {party.description && (
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{party.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[11px]">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Users className="h-3 w-3" style={{ color }} />
            {candidateCount} {candidateCount === 1 ? "aspirant" : "aspirants"}
          </span>
          {party.website && (
            <a href={party.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-muted-foreground transition hover:text-primary">
              Site <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const RegisterPartyDialog = ({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (p: Party) => void }) => {
  const [form, setForm] = useState({
    name: "",
    abbreviation: "",
    color: "#1B5E20",
    description: "",
    website: "",
    headquarters: "",
    founded_year: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast.error("Party name is required"); return; }
    setSubmitting(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload: any = {
      name: form.name.trim(),
      abbreviation: form.abbreviation.trim() || null,
      color: form.color,
      description: form.description.trim() || null,
      website: form.website.trim() || null,
      headquarters: form.headquarters.trim() || null,
      founded_year: form.founded_year ? Number(form.founded_year) : null,
      created_by: auth?.user?.id ?? null,
    };
    const { data, error } = await supabase.from("political_parties" as any).insert(payload).select().single();
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.error("A party with this name already exists");
      else toast.error(error.message || "Could not register party");
      return;
    }
    toast.success("Party registered!");
    onCreated(data as any);
    setForm({ name: "", abbreviation: "", color: "#1B5E20", description: "", website: "", headquarters: "", founded_year: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register your political party</DialogTitle>
          <DialogDescription>Free listing. Verified parties get a badge after admin review.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Party name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wakenya United" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Abbreviation</Label>
              <Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="WU" />
            </div>
            <div>
              <Label>Party color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-14 rounded border border-input cursor-pointer" />
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1 font-mono text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does your party stand for?" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label>Founded year</Label>
              <Input type="number" value={form.founded_year} onChange={(e) => setForm({ ...form, founded_year: e.target.value })} placeholder="2020" />
            </div>
          </div>
          <div>
            <Label>Headquarters</Label>
            <Input value={form.headquarters} onChange={(e) => setForm({ ...form, headquarters: e.target.value })} placeholder="Nairobi" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register party"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PoliticsPage;
