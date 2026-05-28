import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  ASPIRANTS, COUNTIES, POSITION_LABEL, POSITION_PLURAL, ALL_POSITIONS,
  Position, slugify, countyFromSlug, getAspirants, countySeo,
} from "@/data/elections2027";
import { Users, Plus, MapPin } from "lucide-react";

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
  const allNames = [
    ...seeded.map((a) => a.name),
    ...registered.map((r) => r.business_name).filter(Boolean),
  ];
  const label = POSITION_LABEL[pos];
  const title = `${county} ${label} Candidates 2027 — All Aspirants`;
  const desc = `${county} ${label} candidates 2027: ${allNames.slice(0, 6).join(", ") || "register today"}. View campaign adverts on Kenya Adverts.`;
  const seoParagraph = countySeo(county, pos, allNames);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | Kenya Adverts`} description={desc} keywords={`${county} ${label} 2027, ${county} ${label} candidates, ${county} ${label} aspirants, ${label} ${county} 2027`} />
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
      </main>
      <Footer />
    </div>
  );
};

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
  const title = `${name} — ${label} Candidate ${county} 2027`;
  const desc = aspirant?.bio || `${name} is vying for ${county} ${label} in the 2027 Kenya general elections. View campaign details on Kenya Adverts.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | Kenya Adverts`} description={desc} keywords={`${name} ${county} 2027, ${name} ${label}, ${name} vying ${county}, ${name} ${aspirant?.party || ""} 2027`} />
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
      </main>
      <Footer />
    </div>
  );
};

export const CountyHubPage = () => {
  const { county: countySlug } = useParams<{ county: string }>();
  const county = countySlug ? countyFromSlug(countySlug) : null;
  const registered = useRegisteredAspirants(county || undefined);

  if (!county) {
    return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-12 text-center"><h1 className="text-2xl font-bold">County not found</h1></div><Footer /></div>;
  }

  const title = `${county} County Aspirants 2027 — Governor, Senator, MP, MCA`;
  const desc = `All ${county} County aspirants for the 2027 Kenya general elections by seat. Governor, Senator, Woman Rep, MP and MCA candidates.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | Kenya Adverts`} description={desc} keywords={`${county} 2027 elections, ${county} aspirants, ${county} governor candidates, ${county} MCA candidates`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>{" / "}<span>{county}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2"><MapPin className="w-7 h-7" /> {county} County — 2027 Aspirants</h1>
        <p className="mt-3 text-foreground/80">All registered candidates vying for elective positions in {county} County in the 2027 Kenya general elections.</p>

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

        <div className="mt-10">
          <Button asChild><Link to="/politics/new"><Plus className="w-4 h-4 mr-1" /> Register Your Campaign</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const PositionHubPage = ({ position }: { position: Position }) => {
  const registered = useRegisteredAspirants(undefined, position);
  const label = POSITION_LABEL[position];
  const plural = POSITION_PLURAL[position];
  const title = `${plural} 2027 — All Kenya Aspirants by County`;
  const desc = `Complete list of ${label} aspirants in Kenya for the 2027 general elections, organised by county. View campaign adverts on Kenya Adverts.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | Kenya Adverts`} description={desc} keywords={`${plural} 2027, Kenya ${label} candidates, ${label} aspirants Kenya, 2027 elections ${plural}`} />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav className="text-xs text-muted-foreground mb-3">
          <Link to="/elections-2027" className="hover:underline">Elections 2027</Link>{" / "}<span>{plural}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2"><Users className="w-7 h-7" /> Kenya {plural} 2027</h1>
        <p className="mt-3 text-foreground/80">All {label} aspirants for the 2027 Kenya general elections, listed by county. Click a county to view every registered candidate.</p>

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
      </main>
      <Footer />
    </div>
  );
};

export const ElectionsIndexPage = () => {
  const title = "Kenya 2027 Elections — All Aspirants by Seat & County";
  const desc = "Browse every aspirant vying for Governor, Senator, MP, Women Rep and MCA seats in Kenya's 2027 general elections. Find candidates by county or position.";
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${title} | Kenya Adverts`} description={desc} keywords="Kenya 2027 elections, 2027 aspirants, Kenya governor 2027, Kenya senator 2027, Kenya MP 2027, MCA 2027" />
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-bold">Kenya 2027 General Elections — All Aspirants</h1>
        <p className="mt-3 text-foreground/80 leading-relaxed">
          The 2027 Kenya general elections will fill 1,883 elective seats across 47 counties. Browse every declared and registered aspirant for Governor, Senator, Woman Representative, Member of Parliament and Member of County Assembly. If you are vying for any seat, <Link to="/politics/new" className="text-primary underline">post your campaign advert</Link> today.
        </p>

        <h2 className="text-xl font-semibold mt-10 mb-3">Browse by Position</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_POSITIONS.map((p) => (
            <Link key={p} to={`/${p === "women-rep" ? "women-reps" : p === "mp" ? "mps" : p === "mca" ? "mca" : p + "s"}-2027`}>
              <Card className="p-4 hover:border-primary transition-colors">
                <div className="font-semibold">{POSITION_PLURAL[p]} 2027</div>
                <div className="text-sm text-muted-foreground mt-1">All Kenya aspirants by county</div>
              </Card>
            </Link>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-3">Browse by County</h2>
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
