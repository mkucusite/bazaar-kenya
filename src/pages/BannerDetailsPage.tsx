import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, Loader2, Share2, ThumbsUp, Eye, MousePointerClick, Vote, Briefcase, CalendarHeart, HeartHandshake, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { optimizeImageUrl } from "@/lib/image-utils";

type BannerRow = {
  id: string;
  slug: string | null;
  banner_image: string;
  business_name: string;
  description: string | null;
  category: string | null;
  target_url: string;
  votes_count: number;
  is_voting_enabled: boolean;
  clicks: number;
  impressions: number;
};

function getVoterId(): string {
  const k = "ka_voter_id";
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(k, v);
  }
  return v;
}

const BannerDetailsPage = () => {
  const { slug } = useParams();
  const [banner, setBanner] = useState<BannerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let { data } = await supabase.from("banner_campaigns" as any).select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await supabase.from("banner_campaigns" as any).select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      if (mounted) {
        setBanner(data as any);
        setLoading(false);
        if (data) {
          supabase.rpc("increment_banner_impressions", { campaign_id: (data as any).id } as any);
          const voterId = getVoterId();
          const { data: existing } = await supabase
            .from("banner_votes" as any)
            .select("id")
            .eq("banner_id", (data as any).id)
            .eq("voter_identifier", voterId)
            .maybeSingle();
          if (existing) setHasVoted(true);
        }
      }
    };
    load();
    return () => { mounted = false; };
  }, [slug]);

  const vote = async () => {
    if (!banner || hasVoted || voting) return;
    setVoting(true);
    const voterId = getVoterId();
    const { data, error } = await supabase.rpc("cast_banner_vote", { target_banner_id: banner.id, voter: voterId } as any);
    setVoting(false);
    if (error) { toast.error("Could not vote"); return; }
    const r = data as any;
    if (r?.ok) {
      setHasVoted(true);
      setBanner({ ...banner, votes_count: r.votes });
      toast.success("Vote counted! 🎉");
    } else if (r?.error === "already_voted") {
      setHasVoted(true);
      toast.info("You've already voted");
    } else {
      toast.error("Voting unavailable");
    }
  };

  const share = async () => {
    if (!banner) return;
    const url = `${window.location.origin}/banners/${banner.slug || banner.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: banner.business_name, text: banner.description || "", url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const handleClick = () => {
    if (banner) supabase.rpc("increment_banner_clicks", { campaign_id: banner.id } as any);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!banner) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-app py-20 text-center">
        <h1 className="text-2xl font-bold">Banner not found</h1>
        <Button asChild className="mt-4"><Link to="/banners">Browse banners</Link></Button>
      </main>
      <Footer />
    </div>
  );

  const meta = CATEGORY_META[banner.category || "business"] ?? CATEGORY_META.business;
  const Icon = meta.icon;
  const isPolitician = banner.category === "politician";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isPolitician ? "Person" : "Organization",
    name: banner.business_name,
    description: banner.description || `${banner.business_name} on KenyaAdvert`,
    image: banner.banner_image,
    url: `https://www.kenyaadverts.co.ke/banners/${banner.slug || banner.id}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${banner.business_name} — ${meta.label} on KenyaAdvert`}
        description={(banner.description || `${banner.business_name} — ${meta.label.toLowerCase()} campaign. View, vote and share.`).slice(0, 160)}
        canonical={`https://www.kenyaadverts.co.ke/banners/${banner.slug || banner.id}`}
        ogImage={banner.banner_image}
        structuredData={jsonLd}
      />
      <Navbar />

      <main className="container-app max-w-5xl py-6 md:py-10">
        {isPolitician ? (
          <PoliticianLayout
            banner={banner} hasVoted={hasVoted} voting={voting} onVote={vote} onShare={share} onClick={handleClick}
          />
        ) : (
          <StandardLayout
            banner={banner} meta={meta} Icon={Icon}
            hasVoted={hasVoted} voting={voting} onVote={vote} onShare={share} onClick={handleClick}
          />
        )}

        <div className="mt-8">
          <Link to="/banners" className="text-sm text-primary hover:underline">← Back to all banners</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// =================== POLITICIAN LAYOUT (poster style) ===================
const PoliticianLayout = ({ banner, hasVoted, voting, onVote, onShare, onClick }: any) => (
  <div className="overflow-hidden rounded-3xl border-2 border-primary/30 bg-card shadow-xl">
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/40 to-primary/10 sm:aspect-[16/9]">
      <img src={optimizeImageUrl(banner.banner_image, 1400)} alt={banner.business_name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground shadow-lg">
        <Vote className="h-3.5 w-3.5" /> Political Campaign
      </div>
      <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
        <h1 className="text-3xl font-extrabold leading-tight drop-shadow-lg sm:text-5xl">{banner.business_name}</h1>
        {banner.description && (
          <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">{banner.description}</p>
        )}
      </div>
    </div>

    {/* Vote panel */}
    <div className="border-t border-border bg-gradient-to-b from-primary/5 to-transparent p-6 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-2 text-5xl font-extrabold text-primary sm:text-6xl">{banner.votes_count.toLocaleString()}</div>
        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Votes</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {banner.is_voting_enabled && (
          <Button size="lg" className="sm:col-span-1 font-bold" disabled={hasVoted || voting} onClick={onVote}>
            {voting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            {hasVoted ? "✓ Voted" : "Vote Now"}
          </Button>
        )}
        <Button asChild size="lg" variant="outline" className={banner.is_voting_enabled ? "sm:col-span-1" : "sm:col-span-2"} onClick={onClick}>
          <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
            Learn More <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button size="lg" variant="outline" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />Share
        </Button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
        <div>
          <div className="text-lg font-bold">{banner.clicks.toLocaleString()}</div>
          <div className="text-[10px] uppercase text-muted-foreground">Profile clicks</div>
        </div>
        <div>
          <div className="text-lg font-bold">{banner.impressions.toLocaleString()}</div>
          <div className="text-[10px] uppercase text-muted-foreground">Views</div>
        </div>
      </div>
    </div>
  </div>
);

// =================== STANDARD LAYOUT (business / event / ngo) ===================
const StandardLayout = ({ banner, meta, Icon, hasVoted, voting, onVote, onShare, onClick }: any) => (
  <Card className="overflow-hidden">
    <div className="aspect-[3/1] w-full overflow-hidden bg-muted">
      <img src={optimizeImageUrl(banner.banner_image, 1400)} alt={banner.business_name} className="h-full w-full object-cover" />
    </div>

    <div className="space-y-5 p-6 md:p-8">
      <div>
        <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meta.badgeClass}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{banner.business_name}</h1>
      </div>

      {banner.description && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground md:text-base">{banner.description}</p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<ThumbsUp className="h-4 w-4" />} label="Votes" value={banner.votes_count} highlight={banner.is_voting_enabled} />
        <Stat icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={banner.clicks} />
        <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={banner.impressions} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        {banner.is_voting_enabled && (
          <Button size="lg" className="flex-1" disabled={hasVoted || voting} onClick={onVote}>
            {voting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
            {hasVoted ? "Voted" : "Vote"}
          </Button>
        )}
        <Button asChild size="lg" variant={banner.is_voting_enabled ? "outline" : "default"} className="flex-1" onClick={onClick}>
          <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
            Visit <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button size="lg" variant="outline" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />Share
        </Button>
      </div>
    </div>
  </Card>
);

const Stat = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-xl border p-3 text-center ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
    <div className="mb-1 flex justify-center text-muted-foreground">{icon}</div>
    <div className="text-lg font-bold">{value.toLocaleString()}</div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

const CATEGORY_META: Record<string, { label: string; icon: typeof Vote; badgeClass: string }> = {
  politician: { label: "Politician", icon: Vote,           badgeClass: "bg-primary text-primary-foreground" },
  business:   { label: "Business",   icon: Briefcase,      badgeClass: "bg-blue-500/95 text-white" },
  event:      { label: "Event",      icon: CalendarHeart,  badgeClass: "bg-pink-500/95 text-white" },
  ngo:        { label: "NGO",        icon: HeartHandshake, badgeClass: "bg-emerald-500/95 text-white" },
  other:      { label: "Promo",      icon: Sparkles,       badgeClass: "bg-amber-500/95 text-white" },
};

export default BannerDetailsPage;
