import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, MapPin, Phone, ShieldCheck, Sparkles, Tag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AdCard from "@/components/AdCard";
import { DirectoryCard } from "@/components/directory/DirectoryCard";
import NotFound from "@/pages/NotFound";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { DIRECTORY_KINDS, KENYA_COUNTIES, directoryPath, type DirectoryProfile } from "@/lib/directory";
import { SERVICE_BY_SLUG, SERVICE_TOPICS, type ServiceTopic } from "@/lib/services";
import { adVisibilityOr } from "@/lib/aiVisibility";
import { directoryVisibilityOr } from "@/lib/aiVisibility";

const TOP_COUNTIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kilifi"];

const useServiceAds = (topic: ServiceTopic, county: string) =>
  useQuery({
    queryKey: ["service-ads", topic.slug, county],
    queryFn: async () => {
      const filter = topic.keywords.map((k) => `title.ilike.%${k}%`).join(",");
      let q = supabase
        .from("ads")
        .select("*")
        .eq("status", "active")
        .or(adVisibilityOr())
        .eq("is_listed", true)
        .or(filter)
        .order("created_at", { ascending: false })
        .limit(24);
      if (county) q = q.eq("county", county);
      const { data } = await q;
      return ((data || []) as DbAd[]).map(mapDbAdToCard);
    },
    staleTime: 5 * 60 * 1000,
  });

const useServiceProfiles = (topic: ServiceTopic, county: string) =>
  useQuery({
    queryKey: ["service-profiles", topic.slug, county],
    queryFn: async () => {
      let q = (supabase.from("directory_profiles" as any) as any)
        .select("*")
        .in("kind", topic.kinds)
        .eq("is_published", true)
        .or(directoryVisibilityOr())
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(18);
      if (county) q = q.eq("county", county);
      const { data } = await q;
      return (data || []) as DirectoryProfile[];
    },
    staleTime: 5 * 60 * 1000,
  });

const ServicePage = () => {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const county = params.get("county") || "";
  const topic = SERVICE_BY_SLUG[slug];

  const { data: ads = [] } = useServiceAds(topic || SERVICE_TOPICS[0], county);
  const { data: profiles = [] } = useServiceProfiles(topic || SERVICE_TOPICS[0], county);

  const related = useMemo(
    () => (topic ? SERVICE_TOPICS.filter((s) => s.slug !== topic.slug && s.group === topic.group).slice(0, 6) : []),
    [topic],
  );

  if (!topic) return <NotFound />;

  const where = county ? ` in ${county}` : " in Kenya";
  const title = `${topic.name}${where} — Prices & Contacts`;
  const description = `${topic.name}${where}: compare providers, prices and photos, then call or WhatsApp directly. ${topic.priceGuide}`;
  const canonical = `https://www.kenyaadverts.com/services/${topic.slug}`;

  const setCounty = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("county", value);
    else next.delete("county");
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SEOHead
        title={title.slice(0, 60)}
        description={description.slice(0, 158)}
        canonical={canonical}
        keywords={topic.keywords.join(", ")}
        ogImage={topic.image}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: topic.name,
          serviceType: topic.group,
          areaServed: { "@type": "Country", name: "Kenya" },
          provider: { "@type": "Organization", name: "KenyaAdvert" },
          description: topic.intro.slice(0, 300),
          mainEntity: {
            "@type": "FAQPage",
            mainEntity: topic.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        }}
      />
      <Navbar />

      <main className="pb-20 md:pb-10">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <img src={topic.image} alt={topic.name} className="absolute inset-0 h-full w-full object-cover opacity-25" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/60" />
          <div className="container-app relative py-8 md:py-12">
            <Link to="/services" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
              <ChevronLeft className="h-3.5 w-3.5" /> All services
            </Link>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">{topic.group}</p>
            <h1 className="max-w-3xl font-heading text-2xl leading-tight text-foreground md:text-4xl">
              {topic.name}
              {county ? ` in ${county}` : " in Kenya"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">{topic.intro}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Tag className="h-3.5 w-3.5" /> {topic.priceGuide.split(".")[0]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Pay after service — no commission
              </span>
            </div>

            {/* County switcher */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => setCounty("")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !county ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"
                }`}
              >
                All Kenya
              </button>
              {TOP_COUNTIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCounty(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    county === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  {c}
                </button>
              ))}
              <select
                value={KENYA_COUNTIES.includes(county) ? county : ""}
                onChange={(e) => setCounty(e.target.value)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground"
              >
                <option value="">More counties…</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Providers from the directories */}
        <section className="container-app py-7">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg text-foreground md:text-2xl">Providers offering {topic.name.split("(")[0].trim()}</h2>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                Verified businesses and professionals{county ? ` in ${county}` : " countrywide"}.
              </p>
            </div>
            <Link to={directoryPath(topic.kinds[0])} className="shrink-0 text-xs font-semibold text-primary hover:underline md:text-sm">
              See directory
            </Link>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
              <p className="text-sm font-semibold text-foreground">No provider has claimed this service{county ? ` in ${county}` : ""} yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {DIRECTORY_KINDS[topic.kinds[0]].ctaPost} — free, instant and indexed on Google.
              </p>
              <Link
                to={`${DIRECTORY_KINDS[topic.kinds[0]].path}/new`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" /> Be the first here
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {profiles.map((p) => (
                <DirectoryCard key={p.id} profile={p} />
              ))}
            </div>
          )}
        </section>

        {/* Live classified ads for the same service */}
        {ads.length > 0 && (
          <section className="border-y border-border/60 bg-secondary/30 py-7">
            <div className="container-app">
              <h2 className="font-heading text-lg text-foreground md:text-2xl">Latest {topic.name.split("(")[0].trim()} adverts</h2>
              <p className="mb-4 mt-1 text-xs text-muted-foreground md:text-sm">Posted by individuals on KenyaAdvert — newest first.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {ads.map((ad) => (
                  <AdCard key={ad.id} ad={ad} uniform />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Price guide + FAQ */}
        <section className="container-app grid gap-6 py-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-1">
            <h2 className="font-heading text-base text-foreground">What it costs</h2>
            <p className="mt-2 text-sm text-muted-foreground">{topic.priceGuide}</p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> Agree the price before the provider travels.</p>
              <p className="flex items-start gap-2"><Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Call first — a working phone number is the best trust signal.</p>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Meet in a public or receptioned location where possible.</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-heading text-base text-foreground md:text-xl">Frequently asked questions</h2>
            <div className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {topic.faqs.map((f) => (
                <details key={f.q} className="group p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related services */}
        {related.length > 0 && (
          <section className="container-app pb-10">
            <h2 className="mb-3 font-heading text-base text-foreground md:text-xl">Related services</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((s) => (
                <Link
                  key={s.slug}
                  to={`/services/${s.slug}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {s.name}
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

export default ServicePage;
