import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShieldCheck, MapPin, Flag } from "lucide-react";
import politicians from "@/data/politicians.json";

type Politician = typeof politicians[number];

const PAGE_SIZE = 60;

const PoliticiansPage = () => {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("all");
  const [page, setPage] = useState(1);

  const positions = useMemo(() => {
    const s = new Set<string>();
    politicians.forEach((p) => p.position && s.add(p.position));
    return ["all", ...Array.from(s).sort()];
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return (politicians as Politician[]).filter((p) => {
      if (pos !== "all" && p.position !== pos) return false;
      if (!ql) return true;
      return [p.name, p.region, p.party_name, p.position, p.tagline]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(ql));
    });
  }, [q, pos]);

  const pageItems = filtered.slice(0, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Kenya Politicians 2027 — Aspirants, Profiles & Manifestos"
        description="Browse profiles of Kenya's 2027 politicians and aspirants — Governors, Senators, MPs, Woman Reps and MCAs. See parties, bios and contact info."
        canonical="https://www.kenyaadverts.com/politicians"
        keywords="Kenya politicians 2027, Kenya aspirants, governor candidates Kenya, senator candidates Kenya, MP candidates Kenya, MCA candidates Kenya"
      />
      <Navbar />

      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-10">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Kenya Politicians <span className="text-primary">2027</span>
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {politicians.length}+ declared aspirants and politicians across Kenya. Search by name, county, position or party.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search politicians, parties, counties…" className="pl-9" />
            </div>
            <select value={pos} onChange={(e) => { setPos(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {positions.map((p) => <option key={p} value={p}>{p === "all" ? "All positions" : p}</option>)}
            </select>
          </div>
        </div>
      </section>

      <main className="container-app py-8">
        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} politicians found</p>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">No politicians match your search.</div>
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

const PoliticianCard = ({ p }: { p: Politician }) => {
  const initials = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
            <ShieldCheck className="h-3 w-3" />Verified
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
