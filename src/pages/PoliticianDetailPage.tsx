import { useEffect, useState } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, ShieldCheck, MapPin, Flag, Briefcase, Megaphone, Rocket, BadgeCheck, Users, Loader2, GraduationCap } from "lucide-react";
import politicians from "@/data/politicians.json";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { initiatePayment, verifyPayment } from "@/lib/payments";

const BOOST_TIERS = [
  { amount: 3000, label: "Starter Boost", reach: "≈ 15,000 voter impressions", duration: "30 days", highlight: false },
  { amount: 5000, label: "Campaign Boost", reach: "≈ 35,000 voter impressions", duration: "30 days", highlight: true },
  { amount: 10000, label: "Premier Boost", reach: "≈ 90,000 voter impressions + county hero slot", duration: "30 days", highlight: false },
];

const PoliticianDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boostOpen, setBoostOpen] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [boostingAmount, setBoostingAmount] = useState<number | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [boostedUntil, setBoostedUntil] = useState<string | null>(null);

  const p = (politicians as any[]).find((x) => x.slug === slug);
  const profilePath = p ? `/politicians/${p.slug}` : "/politicians";
  const profileUrl = `https://www.kenyaadverts.com${profilePath}`;
  const isCurrentlyBoosted = boostedUntil && new Date(boostedUntil) > new Date();

  useEffect(() => {
    const loadBoostStatus = async () => {
      if (!p) return;
      const { data } = await supabase
        .from("banner_campaigns" as any)
        .select("promoted_until")
        .eq("category", "politician")
        .eq("target_url", profileUrl)
        .eq("status", "active")
        .order("promoted_until", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      setBoostedUntil((data as any)?.promoted_until || null);
    };
    loadBoostStatus();
  }, [p, profileUrl]);

  if (!p) return <Navigate to="/politicians" replace />;

  const positionLabel = p.position || "Aspirant";
  const regionLabel = p.region || "Kenya";
  const title = `${p.name} — ${positionLabel} Aspirant${p.region ? `, ${p.region}` : ""} 2027 | KenyaAdverts`;
  const desc = `Campaign profile for ${p.name}, ${positionLabel.toLowerCase()} aspirant${p.region ? ` for ${p.region}` : ""} in the 2027 Kenya general election. Claim, boost, and publish your campaign messaging directly to ${regionLabel} voters.`.slice(0, 158);
  const canonical = `https://www.kenyaadverts.com/politicians/${p.slug}`;

  const related = (politicians as any[])
    .filter((x) => x.slug !== p.slug && (x.position === p.position || x.party_name === p.party_name || x.region === p.region))
    .slice(0, 8);

  const initials = p.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleBoost = async (amount: number) => {
    if (!user) {
      toast({ title: "Sign in to boost", description: "Create a free account or log in to pay and boost this profile." });
      navigate(`/login?redirect=${encodeURIComponent(profilePath)}`);
      return;
    }
    if (!mpesaPhone.trim()) {
      toast({ title: "M-Pesa number required", description: "Enter the phone number that should receive the STK push." });
      return;
    }

    setBoostingAmount(amount);
    setPaymentMessage("Preparing this profile boost...");
    try {
      const { data: existing } = await supabase
        .from("banner_campaigns" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("category", "politician")
        .eq("target_url", profileUrl)
        .limit(1)
        .maybeSingle();

      let bannerId = (existing as any)?.id as string | undefined;
      if (!bannerId) {
        const { data: created, error: createError } = await supabase
          .from("banner_campaigns" as any)
          .insert({
            user_id: user.id,
            business_name: p.name,
            description: p.bio || `${p.name} campaign profile for Kenya's 2027 election cycle.`,
            target_url: profileUrl,
            category: "politician",
            banner_image: p.photo || p.cover || "/og-image.png",
            gallery_images: [p.photo || p.cover || "/og-image.png"],
            position: "profile_boost",
            status: "pending_payment",
            is_listed: true,
            package_type: "politician_profile_boost",
            country: "Kenya",
            county: p.county || p.region || null,
            running_position: p.position || null,
            party_name: p.party_name || null,
            slogan: p.tagline || null,
          } as any)
          .select("id")
          .single();
        if (createError) throw createError;
        bannerId = (created as any).id;
      }

      setPaymentMessage("Sending M-Pesa STK push...");
      const result = await initiatePayment({
        phone: mpesaPhone,
        amount,
        package_type: "politician_promotion",
        banner_id: bannerId,
        user_id: user.id,
      });
      await supabase.from("banner_campaigns" as any).update({ payment_id: result.payment_id } as any).eq("id", bannerId);
      toast({ title: "STK push sent", description: "Check your phone and enter your M-Pesa PIN." });
      setPaymentMessage("Waiting for M-Pesa confirmation...");

      const started = Date.now();
      while (Date.now() - started < 120000) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const status = await verifyPayment(result.transaction_id).catch(() => null);
        if (status?.status === "completed") {
          const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          setBoostedUntil(until);
          setBoostOpen(false);
          setPaymentMessage("");
          toast({ title: "Profile boosted", description: `${p.name}'s page is now promoted without leaving this profile.` });
          return;
        }
        if (status?.status === "failed") throw new Error("M-Pesa payment failed or was cancelled");
      }
      toast({ title: "Payment pending", description: "This profile will boost automatically once M-Pesa confirms." });
    } catch (error) {
      toast({ title: "Boost failed", description: error instanceof Error ? error.message : "Could not start profile boost.", variant: "destructive" });
    } finally {
      setBoostingAmount(null);
    }
  };

  const handlePostCampaign = () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/politics/new?candidate=${p.slug}`)}`);
      return;
    }
    navigate(`/politics/new?candidate=${encodeURIComponent(p.slug)}&name=${encodeURIComponent(p.name)}&county=${encodeURIComponent(p.county || p.region || "")}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={title}
        description={desc}
        canonical={canonical}
        keywords={`${p.name}, ${p.name} 2027, ${p.position || ""} ${p.region || ""}, ${p.party_name || ""}, campaign ads Kenya 2027, ${p.region || ""} aspirants`}
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
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"><Briefcase className="h-3 w-3" />{p.position} Aspirant 2027</span>
                )}
                {p.region && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium"><MapPin className="h-3 w-3" />{p.region}{p.region_type ? ` (${p.region_type})` : ""}</span>
                )}
                {p.party_name && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium"><Flag className="h-3 w-3" />{p.party_name}{p.party_abbr ? ` (${p.party_abbr})` : ""}</span>
                )}
                {p.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300"><ShieldCheck className="h-3 w-3" />Claimed</span>
                )}
                {isCurrentlyBoosted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"><Rocket className="h-3 w-3" />Boosted</span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button size="lg" onClick={() => setBoostOpen(true)} className="gap-2">
                  <Rocket className="h-4 w-4" /> Boost this profile
                </Button>
                <Button size="lg" variant="secondary" onClick={handlePostCampaign} className="gap-2">
                  <Megaphone className="h-4 w-4" /> Post campaign advert
                </Button>
                {!p.verified && (
                  <Button size="lg" variant="outline" onClick={() => setBoostOpen(true)} className="gap-2">
                    <BadgeCheck className="h-4 w-4" /> Claim this profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Campaign team CTA banner */}
          <div className="border-t border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold md:text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  Are you {p.name.split(" ")[0]}'s campaign team?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Take over this page, publish manifesto banners, and reach {regionLabel} voters who are searching for {p.name.split(" ")[0]} right now.
                </p>
              </div>
              <Button onClick={() => setBoostOpen(true)} size="lg" className="gap-2 whitespace-nowrap">
                <Rocket className="h-4 w-4" />Boost &amp; Claim
              </Button>
            </div>
          </div>

          {p.bio && (
            <div className="border-t border-border p-6 md:p-8">
              <h2 className="mb-3 text-xl font-bold">About {p.name}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 md:text-base">{p.bio}</p>
            </div>
          )}

          {((p.experience && p.experience.length > 0) || (p.education && p.education.length > 0)) && (
            <div className="grid gap-6 border-t border-border p-6 md:grid-cols-2 md:p-8">
              {p.experience && p.experience.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><Briefcase className="h-4 w-4 text-primary" />Public service & work</h2>
                  <div className="space-y-3">
                    {p.experience.slice(0, 5).map((item: any, index: number) => (
                      <div key={`${item.position}-${index}`} className="border-l-2 border-primary/30 pl-3">
                        <p className="text-sm font-semibold">{item.position}</p>
                        {item.organization && <p className="text-xs text-muted-foreground">{item.organization}{item.years ? ` • ${item.years}` : ""}</p>}
                        {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {p.education && p.education.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><GraduationCap className="h-4 w-4 text-primary" />Education</h2>
                  <div className="space-y-3">
                    {p.education.slice(0, 5).map((item: any, index: number) => (
                      <div key={`${item.degree}-${index}`} className="border-l-2 border-primary/30 pl-3">
                        <p className="text-sm font-semibold">{item.degree || item.institution}</p>
                        {item.institution && item.degree && <p className="text-xs text-muted-foreground">{item.institution}{item.years ? ` • ${item.years}` : ""}</p>}
                        {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          <div className="border-t border-border bg-muted/30 p-6 md:p-8">
            <h2 className="mb-3 text-lg font-bold">{p.name} on the 2027 ballot</h2>
            <p className="text-sm text-muted-foreground">
              KenyaAdverts is the largest campaign-advertising marketplace in Kenya. Profiles like this one give aspirants in {regionLabel} an SEO-friendly home that voters discover on Google &mdash; then your campaign team can take it over and boost it nationwide.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/politicians">All politicians</Link></Button>
              <Button asChild size="sm" variant="outline"><Link to="/elections-2027">Elections 2027 hub</Link></Button>
              {p.county && (
                <Button asChild size="sm" variant="outline"><Link to={`/politicians?county=${encodeURIComponent(p.county)}`}>More from {p.county}</Link></Button>
              )}
              {p.region && (
                <Button asChild size="sm" variant="outline"><Link to={`/search?county=${encodeURIComponent(p.region)}`}>Ads in {p.region}</Link></Button>
              )}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-xl font-bold">Related aspirants</h2>
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

      <Dialog open={boostOpen} onOpenChange={setBoostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Boost {p.name}</DialogTitle>
            <DialogDescription>
              Pick a package and pay by M-Pesa. The boost is applied to this profile without opening the campaign poster form.
            </DialogDescription>
          </DialogHeader>
          {isCurrentlyBoosted && (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary">
              This profile is already boosted until {boostedUntil ? new Date(boostedUntil).toLocaleDateString() : "the current promotion ends"}.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="profile-boost-phone">M-Pesa phone number</Label>
            <Input id="profile-boost-phone" inputMode="tel" placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
            {paymentMessage && <p className="text-xs font-medium text-primary">{paymentMessage}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {BOOST_TIERS.map((tier) => (
              <button
                key={tier.amount}
                onClick={() => handleBoost(tier.amount)}
                disabled={boostingAmount !== null}
                className={`group rounded-xl border p-4 text-left transition hover:border-primary hover:shadow-md ${tier.highlight ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                {tier.highlight && <div className="mb-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Most popular</div>}
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tier.label}</div>
                <div className="mt-1 flex items-center gap-2 text-2xl font-extrabold">
                  {boostingAmount === tier.amount && <Loader2 className="h-4 w-4 animate-spin" />}
                  KES {tier.amount.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{tier.duration}</div>
                <div className="mt-1 text-xs text-foreground/80">{tier.reach}</div>
              </button>
            ))}
          </div>
          <DialogFooter className="text-xs text-muted-foreground">
            Payments via M-Pesa. After confirmation, this exact profile is promoted in political discovery sections.
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default PoliticianDetailPage;
