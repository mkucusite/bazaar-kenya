import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, BadgeCheck, Briefcase, CalendarClock, ExternalLink, GraduationCap,
  Loader2, Mail, MapPin, MessageCircle, Phone, Share2, Sparkles, Stethoscope,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { DirectoryCard, gridClassFor } from "@/components/directory/DirectoryCard";
import RevealContact from "@/components/RevealContact";
import { intentFor } from "@/lib/intent";
import {
  DIRECTORY_KINDS, autoMetaDescription, linkThumbnail, normaliseUrl, prettyHost, stripHtml,
  type DirectoryKind, type DirectoryProfile,
} from "@/lib/directory";

const SITE = "https://www.kenyaadverts.com";

const buildJsonLd = (p: DirectoryProfile, url: string) => {
  const address = {
    "@type": "PostalAddress",
    addressLocality: p.town || p.county || "Nairobi",
    addressRegion: p.county || "Kenya",
    addressCountry: "KE",
  };
  if (p.kind === "job") {
    return {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: p.name,
      description: stripHtml(p.description) || p.headline || p.name,
      datePosted: p.created_at,
      validThrough: p.details?.deadline || undefined,
      employmentType: (p.details?.job_type || "FULL_TIME").toString().toUpperCase().replace(/\s+/g, "_"),
      hiringOrganization: { "@type": "Organization", name: p.organisation || "KenyaAdvert Employer", sameAs: p.website || SITE },
      jobLocation: { "@type": "Place", address },
      url,
      ...(p.price
        ? {
            baseSalary: {
              "@type": "MonetaryAmount",
              currency: "KES",
              value: { "@type": "QuantitativeValue", value: p.price, unitText: "MONTH" },
            },
          }
        : {}),
    };
  }
  if (p.kind === "doctor") {
    return {
      "@context": "https://schema.org",
      "@type": "Physician",
      name: p.name,
      medicalSpecialty: p.tags?.[0] || p.headline || "General Practice",
      description: stripHtml(p.description) || p.headline || p.name,
      url,
      telephone: p.phone || undefined,
      email: p.email || undefined,
      image: p.avatar_url || p.images?.[0] || undefined,
      address,
      ...(p.organisation ? { worksFor: { "@type": "Hospital", name: p.organisation } } : {}),
    };
  }
  if (p.kind === "wellness") {
    return {
      "@context": "https://schema.org",
      "@type": "HealthAndBeautyBusiness",
      name: p.name,
      description: stripHtml(p.description) || p.headline || p.name,
      url,
      telephone: p.phone || undefined,
      image: p.images?.[0] || undefined,
      address,
      priceRange: p.price ? `KSh ${Number(p.price).toLocaleString()}+` : undefined,
      makesOffer: (p.tags || []).map((t) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: t } })),
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: p.headline || "Software Developer",
    description: stripHtml(p.description) || p.headline || p.name,
    url,
    image: p.avatar_url || p.images?.[0] || undefined,
    telephone: p.phone || undefined,
    email: p.email || undefined,
    knowsAbout: p.tags || [],
    address,
    ...(p.website ? { sameAs: [normaliseUrl(p.website)] } : {}),
    ...(p.organisation ? { worksFor: { "@type": "Organization", name: p.organisation } } : {}),
  };
};

const DirectoryDetailPage = ({ kind }: { kind: DirectoryKind }) => {
  const { slug } = useParams<{ slug: string }>();
  const config = DIRECTORY_KINDS[kind];

  const { data: profile, isLoading } = useQuery({
    queryKey: ["directory-profile", kind, slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await (supabase.from("directory_profiles" as any) as any)
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return (data || null) as DirectoryProfile | null;
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["directory-related", kind, profile?.id, profile?.county],
    enabled: !!profile,
    queryFn: async () => {
      let q = (supabase.from("directory_profiles" as any) as any)
        .select("*")
        .eq("kind", kind)
        .eq("is_published", true)
        .neq("id", profile!.id)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (profile?.county) q = q.eq("county", profile.county);
      const { data } = await q;
      return (data || []) as DirectoryProfile[];
    },
  });

  useEffect(() => {
    if (profile?.id) {
      (supabase as any).rpc("increment_directory_views", { target_id: profile.id }).then(() => {}, () => {});
    }
  }, [profile?.id]);

  const url = `${SITE}${config.path}/${slug}`;
  const portfolio: any[] = Array.isArray(profile?.details?.portfolio) ? profile!.details!.portfolio : [];

  const jsonLd = useMemo(() => (profile ? buildJsonLd(profile, url) : undefined), [profile, url]);

  const share = async () => {
    const shareData = { title: profile?.name || config.label, text: profile?.headline || "", url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }
    navigator.clipboard?.writeText(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title={`${config.singular} not found`} description={config.seoDescription} robots="noindex, follow" />
        <Navbar />
        <div className="container-app py-20 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Listing not found</h1>
          <Link to={config.path} className="mt-4 inline-block text-primary hover:underline">
            Back to {config.label}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const d = profile.details || {};
  const intent = intentFor(kind);
  const enquiry = `Hi, I found your listing "${profile.name}" on KenyaAdvert.`;
  const metaDesc =
    profile.meta_description ||
    autoMetaDescription(profile.description, `${profile.name} — ${profile.headline || config.label} in ${profile.county || "Kenya"}.`);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SEOHead
        title={profile.seo_title || `${profile.name}${profile.organisation ? ` — ${profile.organisation}` : ""}`}
        description={metaDesc}
        canonical={url}
        keywords={[profile.name, ...(profile.tags || []), profile.county || "", config.keywords].filter(Boolean).join(", ")}
        ogImage={profile.avatar_url || profile.images?.[0]}
        structuredData={jsonLd}
        adLocation={[profile.town, profile.county].filter(Boolean).join(", ")}
        phone={profile.phone || undefined}
        businessName={profile.organisation || undefined}
      />
      <Navbar />
      <main className="pb-28 md:pb-12">
        <div className="container-app py-4">
          <Link to={config.path} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {config.label}
          </Link>
        </div>

        {/* Two-audience strip — visitor vs merchant */}
        <div className="container-app mb-4 grid gap-2 sm:grid-cols-2">
          <Link
            to={intent.seekHref}
            className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            {intent.seekLabel} →
          </Link>
          <Link
            to={intent.offerHref}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            {intent.offerLabel} — free →
          </Link>
        </div>

        <div className="container-app grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6">
            {/* Header card */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {profile.images?.[0] && profile.kind !== "job" && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <OptimizedImage src={profile.images[0]} alt={profile.name} className="h-full w-full object-cover" width={1200} height={675} loading="eager" fetchPriority="high" />
                </div>
              )}
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                  {profile.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" /> Featured
                    </span>
                  )}
                  {profile.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>

                <h1 className="break-words font-heading text-2xl font-bold text-foreground md:text-3xl">
                  {profile.name}
                  {profile.kind === "job" && profile.organisation ? (
                    <span className="font-normal text-muted-foreground"> at {profile.organisation}</span>
                  ) : null}
                </h1>

                {profile.headline && <p className="break-words text-sm text-primary md:text-base">{profile.headline}</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {(profile.location_name || profile.organisation || profile.county) && (
                    <span className="flex items-center gap-1.5">
                      {profile.kind === "doctor" ? <Stethoscope className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      {[profile.location_name || (profile.kind === "job" ? null : profile.organisation), profile.town, profile.county]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                  {d.job_type && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" /> {d.job_type}
                    </span>
                  )}
                  {d.education && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> {d.education}
                    </span>
                  )}
                  {d.deadline && (
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" /> Apply before {new Date(d.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {d.experience && <span>{d.experience} experience</span>}
                </div>

                {profile.price ? (
                  <p className="font-heading text-xl font-bold text-foreground">
                    KSh {Number(profile.price).toLocaleString()}
                    <span className="ml-1 text-xs font-medium text-muted-foreground">
                      {profile.price_label || (profile.kind === "job" ? "per month" : profile.kind === "doctor" ? "consultation" : "from")}
                    </span>
                  </p>
                ) : profile.kind === "job" ? (
                  <p className="text-sm font-medium text-muted-foreground">Salary: negotiable</p>
                ) : null}

                <button onClick={share} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
                  <Share2 className="h-3.5 w-3.5" /> Share this listing
                </button>
              </div>
            </div>

            {/* Description */}
            {profile.description && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">
                  {profile.kind === "job" ? "Job description & requirements" : "About"}
                </h2>
                <div
                  className="prose prose-sm max-w-none break-words text-foreground dark:prose-invert prose-headings:font-heading prose-a:text-primary"
                  dangerouslySetInnerHTML={{ __html: profile.description }}
                />
              </div>
            )}

            {/* Developer portfolio with link previews */}
            {portfolio.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Portfolio — {portfolio.length} live projects</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {portfolio.map((link: any, i: number) => (
                    <a
                      key={`${link.url}-${i}`}
                      href={normaliseUrl(link.url)}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group overflow-hidden rounded-xl border border-border transition hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        <OptimizedImage
                          src={link.image || linkThumbnail(link.url, 800)}
                          alt={link.title || prettyHost(link.url)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          width={800}
                          height={500}
                        />
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="font-heading text-sm font-semibold text-foreground group-hover:text-primary line-clamp-1">
                          {link.title || prettyHost(link.url)}
                        </p>
                        {link.description && <p className="line-clamp-2 text-xs text-muted-foreground">{link.description}</p>}
                        <p className="flex items-center gap-1 text-[11px] font-medium text-primary">
                          <ExternalLink className="h-3 w-3" /> {prettyHost(link.url)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {profile.images && profile.images.length > 1 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Photos</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {profile.images.slice(1).map((img, i) => (
                    <div key={`${img}-${i}`} className="aspect-square overflow-hidden rounded-xl bg-muted">
                      <OptimizedImage src={img} alt={`${profile.name} photo ${i + 2}`} className="h-full w-full object-cover" width={500} height={500} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All expertise / services */}
            {profile.tags && profile.tags.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">{config.tagsLabel}</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((t) => (
                    <Link
                      key={t}
                      to={`${config.path}?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {profile.map_url && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <iframe
                  title="Location map"
                  src={profile.map_url}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          {/* Contact sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {profile.kind === "job" ? "Apply for this job" : "Get in touch"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {profile.kind === "job"
                  ? "Contact the employer directly. Never pay money to get a job."
                  : "Contact directly — KenyaAdvert never charges you for connecting."}
              </p>
              <div className="mt-4 space-y-2">
                <RevealContact
                  phone={profile.phone}
                  whatsapp={profile.whatsapp}
                  email={profile.email}
                  message={enquiry}
                />
                {profile.website && (
                  <a
                    href={normaliseUrl(profile.website)}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" /> Website
                    </span>
                    <span className="max-w-[45%] truncate text-xs font-medium text-muted-foreground">{prettyHost(profile.website)}</span>
                  </a>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Numbers are hidden from scrapers — tap once to reveal.
                </p>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <Link
                  to={intent.seekHref}
                  className="block rounded-xl bg-muted px-4 py-3 text-center text-xs font-semibold text-foreground hover:text-primary"
                >
                  {intent.seekLabel} — compare more options
                </Link>
                <Link
                  to={intent.offerHref}
                  className="block rounded-xl border border-dashed border-border px-4 py-3 text-center text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {intent.offerLabel} — free
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="container-app mt-10">
            <h2 className="mb-4 font-heading text-xl font-bold text-foreground">
              {intent.similarLabel} in {profile.county || "Kenya"}
            </h2>
            <div className={gridClassFor(kind)}>
              {related.map((r) => (
                <DirectoryCard key={r.id} profile={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Sticky mobile action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur md:hidden">
        <RevealContact
          phone={profile.phone}
          whatsapp={profile.whatsapp}
          email={profile.email}
          message={enquiry}
          compact
          className="[&>a]:py-3"
        />
      </div>
      <Footer />
    </div>
  );
};

export default DirectoryDetailPage;
