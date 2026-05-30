import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  COUNTIES, POSITION_LABEL, POSITION_PLURAL, ALL_POSITIONS,
  Position, slugify, countyFromSlug, getAspirants, countySeo,
} from "@/data/elections2027";
import { Users, Plus, MapPin } from "lucide-react";

const SITE = "https://www.kenyaadverts.com";

type RegisteredAspirant = {
  id: string;
  slug: string | null;
  business_name: string;
  party_name: string | null;
  party_color: string | null;
  county: string | null;
  running_position: string | null;
  banner_image: string | null;
  slogan: string | null;
};

const POSITION_MAP_FROM_DB: Record<string, Position> = {
  "governor": "governor",
  "senator": "senator",
  "woman representative": "women-rep",
  "women representative": "women-rep",
  "women rep": "women-rep",
  "member of parliament": "mp",
  "mp": "mp",
  "member of county assembly (mca)": "mca",
  "member of county assembly": "mca",
  "ward representative": "mca",
  "mca": "mca",
};

const POSITION_HUB_PATH: Record<Position, string> = {
  governor: "/governors-2027",
  senator: "/senators-2027",
  "women-rep": "/women-reps-2027",
  mp: "/mps-2027",
  mca: "/mca-2027",
};

const normalizePos = (v?: string | null): Position | null => {
  if (!v) return null;
  return POSITION_MAP_FROM_DB[v.toLowerCase().trim()] || null;
};

export const useRegisteredAspirants = (county?: string, position?: Position) => {
  const [rows, setRows] = useState<RegisteredAspirant[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      let q = supabase
        .from("banner_campaigns")
        .select("id, slug, business_name, party_name, party_color, county, running_position, banner_image, slogan")
        .eq("category", "politician")
        .eq("status", "active")
        .eq("is_hidden_by_report", false)
        .limit(2000);
      if (county) q = q.ilike("county", county);
      const { data } = await q;
      if (!active) return;
      const filtered = (data || []).filter((r: any) => !position || normalizePos(r.running_position) === position);
      setRows(filtered as RegisteredAspirant[]);
    })();
    return () => { active = false; };
  }, [county, position]);
  return rows;
};

const breadcrumbSchema = (items: Array<{ name: string; item: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: it.item,
  })),
});

// ---------------- Seat page ----------------
export const SeatPage = () => {
  const { county: countySlug, position } = useParams<{ county: string; position: Position }>();
  const county = countySlug ? countyFromSlug(countySlug) : null;
  const pos = position && (ALL_POSITIONS as string[]).includes(position) ? (position as Position) : null;
  const registered = useRegisteredAspirants(county || undefined, pos || undefined);

  if (!county || !pos) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Seat not found</h1>
          <p className="text-muted-foreground mt-2">Check the URL or browse <Link to="/elections-2027" className="text-primary underline">all 2027 seats</Link>.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const seeded = getAspirants(county, pos);
  const label = POSITION_LABEL[pos];
  const allCandidates = [
    ...seeded.map((a) => ({ name: a.name, url: `${SITE}/candidates/${slugify(county)}/${pos}/${slugify(a.name)}` })),
    ...registered.map((r) => ({ name: r.business_name, url: `${SITE}/politics/${r.slug || r.id}` })),
  ];
  const allNames = allCandidates.map((c) => c.name);
  const canonical = typeof window !== "undefined" ? window.location.href : `${SITE}/seats/${slugify(county)}/${pos}`;
  const title = `${county} ${label} Candidates 2027 | KenyaAdvert`;
  const desc = `All declared ${county} ${label.toLowerCase()} candidates for Kenya's 2027 elections${allNames.length ? `: ${allNames.slice(0, 5).join(", ")}` : ""}. Explore profiles, parties, and campaign adverts for ${county} ${label} on KenyaAdvert.`;
  const seoParagraph = countySeo(county, pos, allNames);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: `${county} ${label} Candidates 2027`,
        description: `All candidates vying for ${county} ${label.toLowerCase()} in Kenya 2027 elections`,
        url: canonical,
        numberOfItems: allCandidates.length,
        itemListElement: allCandidates.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          url: c.url,
        })),
      },
      breadcrumbSchema([
        { name: "Home", item: SITE },
        { name: "Elections 2027", item: `${SITE}/elections-2027` },
        { name: county, item: `${SITE}/counties/${slugify(county)}` },
        { name: label, item: canonical },
      ]),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={desc} canonical={canonical} structuredData={structuredData} keywords={`${county} ${label} 2027, ${county} ${label} candidates, ${county} ${label} aspirants, ${label} ${county} 2027`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>
          {" / "}<Link to={`/counties/${slugify(county)}`} className="hover:underline">{county}</Link>
          {" / "}<span>{label}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold">Who is Vying for {county} {label} 2027?</h1>
        <p className="mt-4 text-foreground/80 leading-relaxed">{seoParagraph}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild><Link to="/politics/new"><Plus className="w-4 h-4 mr-1" /> Register as Aspirant</Link></Button>
          <Button variant="outline" asChild><Link to={`/counties/${slugify(county)}`}>All {county} seats</Link></Button>
          <Button variant="ghost" asChild><Link to={POSITION_HUB_PATH[pos]}>All Kenya {POSITION_PLURAL[pos]}</Link></Button>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-3">Registered Aspirants ({allNames.length})</h2>
        {allNames.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            No aspirants registered yet. Be the first — <Link to="/politics/new" className="text-primary underline">register here</Link>.
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {seeded.map((a) => (
            <Card key={a.name} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {a.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/candidates/${slugify(county)}/${pos}/${slugify(a.name)}`} className="font-semibold hover:text-primary block truncate">{a.name}</Link>
                  <div className="text-xs text-muted-foreground">{a.party}{a.incumbent ? " · Incumbent" : ""}</div>
                </div>
              </div>
              {a.bio && <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{a.bio}</p>}
              {a.note && <Badge variant="secondary" className="mt-2 text-[10px]">{a.note}</Badge>}
            </Card>
          ))}
          {registered.map((r) => (
            <Card key={r.id} className="p-4 border-primary/40">
              <div className="flex items-start gap-3">
                {r.banner_image ? (
                  <img src={r.banner_image} alt={r.business_name} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {r.business_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/politics/${r.slug || r.id}`} className="font-semibold hover:text-primary block truncate">{r.business_name}</Link>
                  <div className="text-xs text-muted-foreground">{r.party_name || "Independent"} · Verified aspirant</div>
                </div>
              </div>
              {r.slogan && <p className="text-sm text-foreground/70 mt-2 line-clamp-2 italic">"{r.slogan}"</p>}
            </Card>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t text-sm text-muted-foreground">
          <Link to={`/counties/${slugify(county)}`} className="text-primary hover:underline">← Back to all {county} County 2027 seats</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------------- Candidate page ----------------
export const CandidatePage = () => {
  const { county: countySlug, position, slug } = useParams<{ county: string; position: Position; slug: string }>();
  const county = countySlug ? countyFromSlug(countySlug) : null;
  const pos = position && (ALL_POSITIONS as string[]).includes(position) ? (position as Position) : null;
  if (!county || !pos || !slug) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">Candidate not found</h1></div>
        <Footer /></div>
    );
  }
  const aspirant = getAspirants(county, pos).find((a) => slugify(a.name) === slug);
  const label = POSITION_LABEL[pos];
  const name = aspirant?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const canonical = typeof window !== "undefined" ? window.location.href : `${SITE}/candidates/${slugify(county)}/${pos}/${slug}`;
  const title = `${name} — ${label} Candidate ${county} 2027 | KenyaAdvert`;
  const desc = `${name} is vying for ${county} ${label.toLowerCase()} in Kenya's 2027 general elections. View their campaign advert, party, and manifesto on KenyaAdvert.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name,
        url: canonical,
        affiliation: aspirant?.party ? { "@type": "Organization", name: aspirant.party } : undefined,
        description: aspirant?.bio || desc,
      },
      breadcrumbSchema([
        { name: "Home", item: SITE },
        { name: "Elections 2027", item: `${SITE}/elections-2027` },
        { name: county, item: `${SITE}/counties/${slugify(county)}` },
        { name: label, item: `${SITE}/seats/${slugify(county)}/${pos}` },
        { name, item: canonical },
      ]),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={desc} canonical={canonical} structuredData={structuredData} keywords={`${name} ${county} 2027, ${name} ${label}, ${name} vying ${county}, ${name} ${aspirant?.party || ""} 2027`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>
          {" / "}<Link to={`/counties/${slugify(county)}`} className="hover:underline">{county}</Link>
          {" / "}<Link to={`/seats/${slugify(county)}/${pos}`} className="hover:underline">{label}</Link>
          {" / "}<span>{name}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold">{name} Vying for {county} {label} 2027</h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>Party: <strong className="text-foreground">{aspirant?.party || "Independent"}</strong></span>
          {aspirant?.incumbent && <Badge>Incumbent</Badge>}
        </div>
        {aspirant?.bio && <p className="mt-6 text-foreground/80 leading-relaxed">{aspirant.bio}</p>}
        <p className="mt-4 text-foreground/80">
          {name} is one of the candidates vying for the {county} {label} seat in the 2027 Kenya general elections.
          See all {county} {label} aspirants on <Link to={`/seats/${slugify(county)}/${pos}`} className="text-primary underline">the {county} {label} candidates page</Link>.
        </p>
        <Card className="p-4 mt-6">
          <p className="font-semibold">Are you {name}'s campaign team?</p>
          <p className="text-sm text-muted-foreground mt-1">Claim this profile and post a full campaign advert with manifesto and photos.</p>
          <Button className="mt-3" asChild><Link to="/politics/new">Post Campaign Advert</Link></Button>
        </Card>

        <div className="mt-10 pt-6 border-t text-sm">
          <Link to={`/seats/${slugify(county)}/${pos}`} className="text-primary hover:underline">← Back to {county} {label} candidates</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------------- County hub ----------------
export const CountyHubPage = () => {
  const { county: countySlug } = useParams<{ county: string }>();
  const county = countySlug ? countyFromSlug(countySlug) : null;
  const registered = useRegisteredAspirants(county || undefined);

  if (!county) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">County not found</h1></div><Footer /></div>;
  }

  const canonical = typeof window !== "undefined" ? window.location.href : `${SITE}/counties/${slugify(county)}`;
  const title = `Ads in ${county} County | KenyaAdvert`;
  const desc = `Browse all ads, services, and 2027 election candidates in ${county} County. View campaign adverts and local marketplace deals on KenyaAdvert.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${county} County Election Candidates 2027`,
        description: `All ${county} candidates for the 2027 Kenya general elections`,
        url: canonical,
      },
      breadcrumbSchema([
        { name: "Home", item: SITE },
        { name: "Elections 2027", item: `${SITE}/elections-2027` },
        { name: county, item: canonical },
      ]),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={desc} canonical={canonical} structuredData={structuredData} keywords={`${county} 2027 elections, ${county} aspirants, ${county} governor candidates, ${county} MCA candidates`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>{" / "}<span>{county}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2"><MapPin className="w-7 h-7" /> {county} County — 2027 Aspirants</h1>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          Discover every declared candidate vying for elective seats in {county} County in Kenya's 2027 general elections. This {county} hub
          covers the Governor, Senator, Woman Representative, Member of Parliament and Member of County Assembly (MCA) races, listing both
          incumbent leaders and new aspirants from major parties — UDA, ODM, Wiper, Jubilee, DCP and independents. Voters from across {county}
          can compare manifestos, parties and campaign adverts in one place, while aspirants can register their own campaign profile to reach
          local supporters ahead of the August 2027 vote. KenyaAdverts is Kenya's most active classifieds and campaign-advertising platform,
          publishing fresh political ads daily across all 47 counties.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {ALL_POSITIONS.map((p) => {
            const seeded = getAspirants(county, p);
            const live = registered.filter((r) => normalizePos(r.running_position) === p);
            const total = seeded.length + live.length;
            return (
              <Link key={p} to={`/seats/${slugify(county)}/${p}`}>
                <Card className="p-4 hover:border-primary transition-colors h-full">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{POSITION_LABEL[p]}</h2>
                    <Badge variant="secondary">{total} aspirants</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {[...seeded.map(s => s.name), ...live.map(l => l.business_name)].slice(0, 3).join(", ") || "Register today."}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button asChild><Link to="/politics/new"><Plus className="w-4 h-4 mr-1" /> Register Your Campaign</Link></Button>
          <Button variant="outline" asChild><Link to="/elections-2027">← Back to Elections 2027</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------------- Position hub (governors-2027, etc.) ----------------
export const PositionHubPage = ({ position }: { position: Position }) => {
  const registered = useRegisteredAspirants(undefined, position);
  const label = POSITION_LABEL[position];
  const plural = POSITION_PLURAL[position];
  const canonical = `${SITE}${POSITION_HUB_PATH[position]}`;

  const titles: Record<Position, string> = {
    governor: "Kenya Governor Candidates 2027 — All 47 Counties | KenyaAdverts",
    senator: "Kenya Senator Candidates 2027 — All 47 Counties | KenyaAdverts",
    "women-rep": "Kenya Women Representative Candidates 2027 | KenyaAdverts",
    mp: "Kenya MP Candidates 2027 — All 290 Constituencies | KenyaAdverts",
    mca: "MCA Candidates 2027 — All Counties and Wards | KenyaAdverts",
  };
  const descs: Record<Position, string> = {
    governor: "Find Governor aspirants for all 47 counties in Kenya for the 2027 elections. Compare candidates, read manifestos and follow campaigns on KenyaAdverts.",
    senator: "Find Senator aspirants for all 47 counties in Kenya for the 2027 general elections. View candidate profiles, party affiliations and manifestos on KenyaAdverts.",
    "women-rep": "Find Women Representative aspirants for all 47 counties in Kenya for the 2027 elections. View profiles, manifestos and campaign pages on KenyaAdverts.",
    mp: "Find MP aspirants and candidates across all 290 constituencies in Kenya for the 2027 general elections. View profiles, manifestos and campaign pages on KenyaAdverts.",
    mca: "Find MCA aspirants for wards across all 47 counties in Kenya for the 2027 elections. View ward candidates, manifestos and campaign pages on KenyaAdverts.",
  };
  const intros: Record<Position, string> = {
    governor: "Kenya's 47 county governors hold some of the most powerful elective offices in the country, controlling devolved budgets that fund health, water, roads and agriculture. The 2027 gubernatorial race will see dozens of incumbents seek re-election while challengers from UDA, ODM, Wiper, DCP and independent platforms launch fresh bids. This page brings together every declared and registered governor aspirant across all 47 counties so voters can compare manifestos and aspirants can publish campaign adverts to reach county-level supporters.",
    senator: "Senators represent counties in Kenya's bicameral parliament and oversee devolved funds and county legislation. The 2027 senate race is expected to attract veteran politicians and first-time aspirants in every county. Browse the full list of declared senate candidates here, filter by county, view party affiliation, and post your own senate campaign advert if you are vying for the seat. KenyaAdverts is Kenya's most active classifieds and campaign-advertising platform.",
    "women-rep": "Kenya elects 47 county woman representatives to the National Assembly — one for every county. The 2027 women rep race is one of the most competitive elective contests, with strong incumbents seeking re-election and new women leaders entering politics for the first time. This page lists every declared women rep aspirant in Kenya for the 2027 general elections, organised by county so voters can find their candidates and aspirants can advertise their campaigns.",
    mp: "Kenya's National Assembly has 290 constituency MPs elected directly by voters every five years. The 2027 MP race will fill every constituency seat, with incumbents and new aspirants from UDA, ODM, Wiper, Jubilee, DCP and independent platforms competing for support. Find every declared MP candidate by county and constituency, view their party and manifesto, and post your campaign advert on KenyaAdverts to reach voters in your constituency.",
    mca: "MCAs (Members of County Assembly) are elected at the ward level — Kenya has 1,450 wards across the 47 county assemblies. They control ward development funds and pass county-level legislation. The 2027 MCA race is the most local of all elections, with thousands of aspirants competing nationwide. This page consolidates MCA candidates by county so voters can find their ward leaders and aspirants can publish campaign adverts ahead of the August 2027 vote.",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: titles[position],
        description: descs[position],
        url: canonical,
      },
      breadcrumbSchema([
        { name: "Home", item: SITE },
        { name: "Elections 2027", item: `${SITE}/elections-2027` },
        { name: plural, item: canonical },
      ]),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={titles[position]} description={descs[position]} canonical={canonical} structuredData={structuredData} keywords={`${plural} 2027, Kenya ${label} candidates, ${label} aspirants Kenya, 2027 elections ${plural}`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>{" / "}<span>{plural}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2"><Users className="w-7 h-7" /> Kenya {plural} 2027</h1>
        <p className="mt-3 text-foreground/80 leading-relaxed">{intros[position]}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {COUNTIES.map((c) => {
            const seeded = getAspirants(c, position);
            const live = registered.filter((r) => r.county?.toLowerCase() === c.toLowerCase());
            const total = seeded.length + live.length;
            return (
              <Link key={c} to={`/seats/${slugify(c)}/${position}`}>
                <Card className="p-3 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c}</div>
                    <Badge variant={total ? "default" : "secondary"} className="text-[10px]">{total}</Badge>
                  </div>
                  {total > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {[...seeded.map(s => s.name), ...live.map(l => l.business_name)].slice(0, 2).join(", ")}
                    </p>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 pt-6 border-t flex flex-wrap gap-3 text-sm">
          <Link to="/elections-2027" className="text-primary hover:underline">← All 2027 Elections</Link>
          {ALL_POSITIONS.filter((p) => p !== position).map((p) => (
            <Link key={p} to={POSITION_HUB_PATH[p]} className="text-primary hover:underline">{POSITION_PLURAL[p]} 2027</Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------------- Master /elections-2027 hub ----------------
export const ElectionsIndexPage = () => {
  const canonical = `${SITE}/elections-2027`;
  const title = "Kenya 2027 General Elections — All Candidates & Counties | KenyaAdverts";
  const desc = "Kenya 2027 general elections hub — find Governor, Senator, MP, Women Rep and MCA candidates across all 47 counties. Follow campaigns and manifestos on KenyaAdverts.";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description: desc,
        url: canonical,
      },
      breadcrumbSchema([
        { name: "Home", item: SITE },
        { name: "Elections 2027", item: canonical },
      ]),
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={title} description={desc} canonical={canonical} structuredData={structuredData} keywords="Kenya 2027 elections, 2027 aspirants, Kenya governor 2027, Kenya senator 2027, Kenya MP 2027, MCA 2027" />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold">Kenya 2027 General Elections — All Aspirants</h1>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          Kenya's 2027 general elections will fill 1,883 elective seats across 47 counties — President, 47 Governors, 47 Senators,
          47 Woman Representatives, 290 Members of Parliament and 1,450 Members of County Assembly (MCA). This is the country's most
          consequential vote of the decade. KenyaAdverts brings together every declared and registered aspirant for the 2027 ballot
          in one searchable hub. Browse candidates by position to see all governors, senators, women reps, MPs or MCAs nationwide,
          or browse by county to find every aspirant vying in your home area. Each candidate profile lists their party affiliation,
          biography and campaign details. If you are vying for any seat, <Link to="/politics/new" className="text-primary underline">post your campaign advert</Link>
          {" "}today to reach voters across your county and constituency.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Browse by Position</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_POSITIONS.map((p) => (
            <Link key={p} to={POSITION_HUB_PATH[p]}>
              <Card className="p-4 hover:border-primary transition-colors">
                <div className="font-semibold">{POSITION_PLURAL[p]} 2027</div>
                <div className="text-sm text-muted-foreground mt-1">All Kenya aspirants by county</div>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-3">Browse by County (all 47)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {COUNTIES.map((c) => (
            <Link key={c} to={`/counties/${slugify(c)}`}>
              <Card className="px-3 py-2 hover:border-primary text-sm">{c}</Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ElectionsIndexPage;
