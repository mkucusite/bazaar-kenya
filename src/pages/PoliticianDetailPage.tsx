import { useParams, Link, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, MapPin, Flag, Briefcase } from "lucide-react";
import politicians from "@/data/politicians.json";

const PoliticianDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const p = (politicians as any[]).find((x) => x.slug === slug);
  if (!p) return <Navigate to="/politicians" replace />;

  const title = `${p.name} — ${p.position || "Politician"}${p.region ? `, ${p.region}` : ""} | Kenya 2027`;
  const desc = (p.bio || `${p.name} is a Kenyan politician${p.position ? ` running for ${p.position}` : ""}${p.region ? ` in ${p.region}` : ""}${p.party_name ? `, ${p.party_name}` : ""}. View profile, party and manifesto on KenyaAdvert.`).slice(0, 155);
  const canonical = `https://www.kenyaadverts.com/politicians/${p.slug}`;

  const related = (politicians as any[])
    .filter((x) => x.slug !== p.slug && (x.position === p.position || x.party_name === p.party_name || x.region === p.region))
    .slice(0, 8);

  const initials = p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={desc}
        canonical={canonical}
        keywords={`${p.name}, ${p.position || ""}, ${p.region || ""}, ${p.party_name || ""}, Kenya 2027 elections`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: p.name,
          jobTitle: p.position,
          affiliation: p.party_name,
          address: p.region ? { "@type": "PostalAddress", addressRegion: p.region, addressCountry: "KE" } : undefined,
          image: p.photo || undefined,
          url: canonical,
          description: desc,
        }}
      />
      <Navbar />

      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-primary/15 to-transparent md:h-64">
        {p.cover && <img src={p.cover} alt="" className="h-full w-full object-cover opacity-50" />}
      </div>

      <main className="container-app -mt-20 pb-12 md:-mt-24">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:p-8">
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-gradient-to-br from-primary/30 to-primary/5 shadow-lg md:h-48 md:w-48">
              {p.photo ? (
                <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-black text-primary/50">{initials}</div>
              )}
            </div>
            <div className="flex-1">
              <Link to="/politicians" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-3 w-3" />Back to politicians
              </Link>
              <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">{p.name}</h1>
              {p.tagline && <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {p.position && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"><Briefcase className="h-3 w-3" />{p.position}</span>
                )}
                {p.region && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium"><MapPin className="h-3 w-3" />{p.region}{p.region_type ? ` (${p.region_type})` : ""}</span>
                )}
                {p.party_name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium"><Flag className="h-3 w-3" />{p.party_name}{p.party_abbr ? ` (${p.party_abbr})` : ""}</span>
                )}
                {p.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300"><ShieldCheck className="h-3 w-3" />Verified</span>
                )}
              </div>
            </div>
          </div>

          {p.bio && (
            <div className="border-t border-border p-6 md:p-8">
              <h2 className="mb-3 text-xl font-bold">About {p.name}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 md:text-base">{p.bio}</p>
            </div>
          )}

          <div className="border-t border-border bg-muted/30 p-6 md:p-8">
            <h2 className="mb-3 text-lg font-bold">Why this matters for Kenya 2027</h2>
            <p className="text-sm text-muted-foreground">
              {p.name} is among the politicians and aspirants documented for the 2027 Kenya general elections.
              Voters in {p.region || "Kenya"} can use this profile to evaluate candidates ahead of the August 2027 vote.
              {p.party_name ? ` ${p.name} is associated with ${p.party_name}${p.party_abbr ? ` (${p.party_abbr})` : ""}.` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/politicians">All politicians</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/elections-2027">Elections 2027 hub</Link></Button>
              {p.region && (
                <Button asChild size="sm" variant="outline"><Link to={`/search?county=${encodeURIComponent(p.region)}`}>Ads in {p.region}</Link></Button>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">Related politicians</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {related.map((r) => (
                <Link key={r.slug} to={`/politicians/${r.slug}`} className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/40 hover:shadow">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-primary/10">
                    {r.photo ? <img src={r.photo} alt={r.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary/60">{r.name.split(" ").map((w: string) => w[0]).join("").slice(0,2)}</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold group-hover:text-primary">{r.name}</div>
                    <div className="line-clamp-1 text-[11px] text-muted-foreground">{r.position}{r.region ? ` • ${r.region}` : ""}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PoliticianDetailPage;
