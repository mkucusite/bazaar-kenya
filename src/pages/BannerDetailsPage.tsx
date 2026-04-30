import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Loader2, Share2, ThumbsUp, Eye, MousePointerClick, Vote, Briefcase, CalendarHeart, HeartHandshake, Sparkles, Award, Facebook, Twitter, MessageCircle } from "lucide-react";
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
  running_position?: string | null;
  party_name?: string | null;
  party_color?: string | null;
  candidate_number?: string | null;
  slogan?: string | null;
  manifesto_points?: string[] | null;
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
            banner={banner} hasVoted={hasVoted} voting={voting} onVote={vote} onShare={share} onClick={handleClick} onOpenImage={() => setLightboxOpen(true)}
          />
        ) : (
          <StandardLayout
            banner={banner} meta={meta} Icon={Icon}
            hasVoted={hasVoted} voting={voting} onVote={vote} onShare={share} onClick={handleClick} onOpenImage={() => setLightboxOpen(true)}
          />
        )}

        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
            <img src={banner.banner_image} alt={banner.business_name} className="h-auto max-h-[85vh] w-full rounded-xl object-contain" />
          </DialogContent>
        </Dialog>

        <div className="mt-8">
          <Link to="/banners" className="text-sm text-primary hover:underline">← Back to all banners</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// =================== POLITICIAN LAYOUT (Kenyan campaign poster) ===================
const PoliticianLayout = ({ banner, hasVoted, voting, onVote, onShare, onClick, onOpenImage }: any) => {
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/banners/${banner.slug || banner.id}` : "";
  const shareText = `Piga Kura — ${banner.business_name}${banner.running_position ? ` for ${banner.running_position}` : ""} on KenyaAdvert`;
  const partyColor = banner.party_color || "hsl(var(--primary))";
  const manifesto: string[] = Array.isArray(banner.manifesto_points) ? banner.manifesto_points : [];

  return (
    <div className="overflow-hidden rounded-3xl border-2 shadow-2xl" style={{ borderColor: partyColor }}>
      {/* Top party color band */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-white" style={{ background: partyColor }}>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider">
          <Vote className="h-4 w-4" />
          {banner.party_name || "Independent"}
        </div>
        {banner.running_position && (
          <div className="text-right text-[11px] font-bold uppercase tracking-wider opacity-95">
            Aspirant • {banner.running_position}
          </div>
        )}
      </div>

      {/* Poster image with overlays */}
      <button type="button" onClick={onOpenImage} className="group relative block aspect-[4/5] w-full overflow-hidden bg-muted sm:aspect-[3/4]" aria-label="View campaign poster">
        <img src={optimizeImageUrl(banner.banner_image, 1400)} alt={banner.business_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

        {/* Candidate ballot number */}
        {banner.candidate_number && (
          <div className="absolute right-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-4 border-white bg-white text-center shadow-2xl">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: partyColor }}>No.</span>
            <span className="text-3xl font-black leading-none text-foreground">{banner.candidate_number}</span>
          </div>
        )}

        {/* Vote tally */}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold shadow-lg" style={{ color: partyColor }}>
          <Award className="h-3.5 w-3.5" /> {banner.votes_count.toLocaleString()} kura
        </div>

        {/* Name + slogan */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-left text-white sm:p-7">
          <h1 className="text-3xl font-black uppercase leading-none tracking-tight drop-shadow-2xl sm:text-5xl">{banner.business_name}</h1>
          {banner.running_position && (
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-white/95 sm:text-base">FOR {banner.running_position}</p>
          )}
          {banner.slogan && (
            <p className="mt-3 inline-block rounded-md px-3 py-1.5 text-sm font-bold italic text-white sm:text-base" style={{ background: partyColor }}>
              "{banner.slogan}"
            </p>
          )}
        </div>
      </button>

      {/* Vote action panel */}
      <div className="bg-card p-6 sm:p-8">
        <div className="mb-5 rounded-2xl p-5 text-center text-white" style={{ background: `linear-gradient(135deg, ${partyColor}, ${partyColor}dd)` }}>
          <div className="text-5xl font-black sm:text-6xl">{banner.votes_count.toLocaleString()}</div>
          <div className="mt-1 text-xs font-bold uppercase tracking-widest opacity-95">Total votes • Kura zilizopigwa</div>
        </div>

        {banner.is_voting_enabled && (
          <Button
            size="lg"
            className="h-16 w-full text-lg font-black uppercase tracking-wider shadow-xl hover:opacity-90"
            style={{ background: partyColor, color: "white" }}
            disabled={hasVoted || voting}
            onClick={onVote}
          >
            {voting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ThumbsUp className="mr-2 h-5 w-5" />}
            {hasVoted ? "✓ Asante! Your vote was counted" : "PIGA KURA — VOTE NOW"}
          </Button>
        )}

        {manifesto.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wider" style={{ color: partyColor }}>
              Manifesto • Ahadi Zangu
            </h3>
            <ul className="space-y-2">
              {manifesto.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white" style={{ background: partyColor }}>
                    {i + 1}
                  </span>
                  <span className="font-medium leading-snug">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {banner.description && (
          <p className="mt-5 whitespace-pre-line border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
            {banner.description}
          </p>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button asChild size="lg" variant="outline" onClick={onClick}>
            <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
              View Full Manifesto <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />Share Campaign
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-5">
          <span className="text-xs font-medium text-muted-foreground">Sambaza kwa:</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" aria-label="Share on WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950" aria-label="Share on X">
            <Twitter className="h-4 w-4" />
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" aria-label="Share on Facebook">
            <Facebook className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
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

      {/* Bottom party color band */}
      <div className="h-2" style={{ background: partyColor }} />
    </div>
  );
};

// =================== STANDARD LAYOUT (business / event / ngo) ===================
const StandardLayout = ({ banner, meta, Icon, hasVoted, voting, onVote, onShare, onClick, onOpenImage }: any) => (
  <Card className="overflow-hidden">
    <button type="button" onClick={onOpenImage} className="block aspect-[3/1] w-full overflow-hidden bg-muted" aria-label="View banner image">
      <img src={optimizeImageUrl(banner.banner_image, 1400)} alt={banner.business_name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]" />
    </button>

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
