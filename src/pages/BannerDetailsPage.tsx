import { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ExternalLink, Loader2, Share2, ThumbsUp, Eye, MousePointerClick, Vote,
  Briefcase, CalendarHeart, HeartHandshake, Sparkles, Award,
  Facebook, Twitter, MessageCircle, Heart, Flag, Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { optimizeImageUrl } from "@/lib/image-utils";
import ReportDialog from "@/components/ReportDialog";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { RichText } from "@/components/ui/rich-text";

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
  likes_count?: number;
  gallery_images?: string[] | null;
  running_position?: string | null;
  party_name?: string | null;
  party_color?: string | null;
  candidate_number?: string | null;
  slogan?: string | null;
  manifesto_points?: string[] | null;
  user_id?: string | null;
  status?: string | null;
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [banner, setBanner] = useState<BannerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promotePhone, setPromotePhone] = useState("");
  const [promoteAmount, setPromoteAmount] = useState("1000");
  const [promoteError, setPromoteError] = useState("");
  const [promoting, setPromoting] = useState(false);

  const toggleLike = async () => {
    if (!banner) return;
    const liker = getVoterId();
    const { data, error } = await supabase.rpc("toggle_banner_like", { target_banner_id: banner.id, liker } as any);
    if (error) { toast.error("Could not like"); return; }
    const r = data as any;
    setLiked(!!r?.liked);
    setBanner({ ...banner, likes_count: r?.count ?? banner.likes_count });
    if (r?.liked) {
      setLikeBurst(true);
      setTimeout(() => setLikeBurst(false), 700);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) toggleLike();
    else { setLikeBurst(true); setTimeout(() => setLikeBurst(false), 700); }
  };

  useEffect(() => {
    if (!banner) return;
    const images = (banner.gallery_images && banner.gallery_images.length > 0) ? banner.gallery_images : [banner.banner_image];
    if (images.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentImageIndex((current) => (current + 1) % images.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [banner?.id, banner?.gallery_images?.length]);

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
          const isPol = (data as any).category === "politician";
          const onBannersPath = location.pathname.startsWith("/banners/");
          const onPoliticsPath = location.pathname.startsWith("/politics/");
          if (isPol && onBannersPath) {
            navigate(`/politics/${(data as any).slug || (data as any).id}`, { replace: true });
            return;
          }
          if (!isPol && onPoliticsPath) {
            navigate(`/banners/${(data as any).slug || (data as any).id}`, { replace: true });
            return;
          }
          supabase.rpc("increment_banner_impressions", { campaign_id: (data as any).id } as any);
          supabase.rpc("bump_banner_engagement" as any, { target_banner_id: (data as any).id } as any);
          const voterId = getVoterId();
          const { data: existing } = await supabase
            .from("banner_votes" as any)
            .select("id")
            .eq("banner_id", (data as any).id)
            .eq("voter_identifier", voterId)
            .maybeSingle();
          if (existing) setHasVoted(true);
          const { data: existingLike } = await supabase
            .from("banner_likes" as any).select("id")
            .eq("banner_id", (data as any).id)
            .eq("liker_identifier", voterId)
            .maybeSingle();
          if (existingLike) setLiked(true);
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
    const url = `${window.location.origin}/share/banner/${banner.slug || banner.id}`;
    const title = banner.business_name;
    const text = `${url}\n\n${title}`;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const handleClick = () => {
    if (banner) supabase.rpc("increment_banner_clicks", { campaign_id: banner.id } as any);
  };

  const handlePromote = async () => {
    if (!banner) return;
    const isPol = banner.category === "politician";
    const minAmt = isPol ? 1000 : 500;
    const maxAmt = isPol ? 5000 : 1000;
    const amount = Number(promoteAmount) || 0;
    if (amount < minAmt) { setPromoteError(`Minimum boost amount is KSh ${minAmt}`); return; }
    if (amount > maxAmt) { setPromoteError(`Maximum boost amount is KSh ${maxAmt}`); return; }
    if (!promotePhone.trim()) { toast.error("Enter M-Pesa phone number"); return; }
    setPromoteError("");
    setPromoting(true);
    try {
      const result = await initiatePayment({ phone: promotePhone, amount, package_type: "banner_boost", banner_id: banner.id, user_id: user?.id });
      toast.success("STK push sent — check your phone");
      const started = Date.now();
      const interval = window.setInterval(async () => {
        const status = await verifyPayment(result.transaction_id).catch(() => null);
        if (status?.status === "completed") {
          window.clearInterval(interval);
          setPromoting(false);
          setPromoteOpen(false);
          toast.success("Promotion activated");
        } else if (status?.status === "failed" || Date.now() - started > 120000) {
          window.clearInterval(interval);
          setPromoting(false);
          toast.error(status?.status === "failed" ? "Payment failed" : "Payment not confirmed yet");
        }
      }, 3000);
    } catch (e) {
      setPromoting(false);
      toast.error(e instanceof Error ? e.message : "Could not start payment");
    }
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
  const bannerImages = (banner.gallery_images && banner.gallery_images.length > 0) ? banner.gallery_images : [banner.banner_image];
  const activeImage = bannerImages[currentImageIndex] || bannerImages[0] || banner.banner_image;
  const urlPath = isPolitician ? "politics" : "banners";
  const detailUrl = `https://www.kenyaadverts.com/${urlPath}/${banner.slug || banner.id}`;

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": isPolitician ? "Person" : "Organization",
    name: banner.business_name,
    description: banner.description || `${banner.business_name} on KenyaAdvert`,
    image: banner.banner_image,
    url: detailUrl,
  };
  if (isPolitician) {
    if (banner.running_position) jsonLd.jobTitle = `Aspirant — ${banner.running_position}`;
    if (banner.party_name) jsonLd.affiliation = { "@type": "Organization", name: banner.party_name };
    jsonLd.nationality = "Kenyan";
  }

  const seoTitle = isPolitician
    ? `${banner.business_name}${banner.running_position ? ` — ${banner.running_position}` : ""}${banner.party_name ? ` (${banner.party_name})` : ""} | Vote on KenyaAdvert`
    : `${banner.business_name} — ${meta.label} on KenyaAdvert`;
  const seoDesc = (banner.slogan || banner.description || `${banner.business_name} — ${meta.label.toLowerCase()} campaign. View, vote and share.`).slice(0, 160);
  const isOwner = !!user && banner.user_id === user.id && banner.status === "active";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={detailUrl}
        ogImage={banner.banner_image}
        structuredData={jsonLd}
      />

      <Navbar />

      <main className="container-app max-w-5xl py-6 md:py-10">
        {isPolitician ? (
          <PoliticianLayout
            banner={banner}
            imageUrl={activeImage}
            images={bannerImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            onShare={share}
            onClick={handleClick}
            onOpenImage={() => setLightboxOpen(true)}
            liked={liked}
            likeBurst={likeBurst}
            onLike={toggleLike}
            onDoubleTap={handleDoubleTap}
            onBoost={() => { setPromoteAmount("1000"); setPromoteOpen(true); }}
          />
        ) : (
          <StandardLayout
            banner={banner}
            meta={meta}
            Icon={Icon}
            imageUrl={activeImage}
            images={bannerImages}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
            hasVoted={hasVoted}
            voting={voting}
            onVote={vote}
            onShare={share}
            onClick={handleClick}
            onOpenImage={() => setLightboxOpen(true)}
            liked={liked}
            likeBurst={likeBurst}
            onLike={toggleLike}
            onDoubleTap={handleDoubleTap}
          />
        )}

        {/* Boost card — shown for ALL users (non-owners too can boost) */}
        <Card className="mt-5 border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground">
                Boost this {isPolitician ? "Campaign" : "Banner"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isPolitician
                  ? "Reach more voters — promote for 30 days (KSh 1,000–5,000)"
                  : "Promote to the top of its category for 30 days (KSh 500–1,000)"}
              </p>
            </div>
            <Button onClick={() => { setPromoteAmount(String(isPolitician ? 1000 : 500)); setPromoteOpen(true); }}>
              <Sparkles className="mr-2 h-4 w-4" /> Boost
            </Button>
          </div>
        </Card>

        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl border-0 bg-transparent p-0 shadow-none">
            <img src={activeImage} alt={banner.business_name} className="h-auto max-h-[85vh] w-full rounded-xl object-contain" />
          </DialogContent>
        </Dialog>

        <div className="mt-8 flex items-center justify-between">
          <Link to="/banners" className="text-sm text-primary hover:underline">← Back to all banners</Link>
          <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="h-3.5 w-3.5" /> Report this banner
          </button>
        </div>
      </main>

      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} kind="banner" targetId={banner.id} targetName={banner.business_name} />

      {/* Boost / Promote Dialog */}
      <Dialog open={promoteOpen} onOpenChange={setPromoteOpen}>
        <DialogContent className="max-w-sm">
          <h2 className="text-lg font-bold">Boost this {isPolitician ? "Campaign" : "Banner"}</h2>
          <p className="text-sm text-muted-foreground">
            Boosting promotes your {isPolitician ? "campaign" : "banner"} to the top of its category for 30 days.
          </p>
          <div className="space-y-3">
            <div>
              <Label>Amount (KSh)</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(isPolitician ? [1000, 3000, 5000] : [500, 750, 1000]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPromoteAmount(String(p)); setPromoteError(""); }}
                    className={`rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition ${
                      Number(promoteAmount) === p
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {isPolitician ? "KSh 1,000 / 3,000 / 5,000 — choose your boost tier" : "KSh 500 / 750 / 1,000 — choose your boost tier"}
              </p>
            </div>
            <div>
              <Label>M-Pesa phone</Label>
              <Input value={promotePhone} onChange={(e) => setPromotePhone(e.target.value)} placeholder="0712345678" />
            </div>
            {promoteError && <p className="text-xs font-medium text-destructive">{promoteError}</p>}
            <Button onClick={handlePromote} disabled={promoting} className="w-full">
              {promoting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Waiting for M-Pesa...</>
                : `Pay KSh ${Number(promoteAmount).toLocaleString()} via M-Pesa`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

// =================== POLITICIAN LAYOUT (improved) ===================
const PoliticianLayout = ({
  banner, imageUrl, images, currentImageIndex, setCurrentImageIndex,
  onShare, onClick, onOpenImage, liked, likeBurst, onLike, onDoubleTap, onBoost,
}: any) => {
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/politics/${banner.slug || banner.id}` : "";
  const shareText = `${banner.business_name}${banner.running_position ? ` — ${banner.running_position}` : ""} on KenyaAdvert`;
  const partyColor = banner.party_color || "hsl(var(--primary))";
  const manifesto: string[] = Array.isArray(banner.manifesto_points) ? banner.manifesto_points : [];

  return (
    <div className="overflow-hidden rounded-3xl border-2 shadow-2xl" style={{ borderColor: partyColor }}>

      {/* Top party band */}
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

      {/* Poster image */}
      <div onDoubleClick={onDoubleTap} className="group relative block w-full overflow-hidden bg-black">
        <img src={optimizeImageUrl(imageUrl, 600)} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-50" />
        <button type="button" onClick={onOpenImage} className="relative flex w-full items-center justify-center" aria-label="View campaign poster" style={{ minHeight: "320px" }}>
          <img src={optimizeImageUrl(imageUrl, 1400)} alt={banner.business_name} className="relative max-h-[80vh] w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]" />
        </button>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="absolute inset-x-0 top-4 flex justify-center gap-1.5">
            {images.map((_: string, index: number) => (
              <button key={index} type="button" onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index); }}
                className={`h-1.5 rounded-full transition-all ${currentImageIndex === index ? "w-6 bg-white" : "w-1.5 bg-white/70"}`}
                aria-label={`Show image ${index + 1}`} />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

        {/* Ballot number */}
        {banner.candidate_number && (
          <div className="absolute right-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-4 border-white bg-white text-center shadow-2xl">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: partyColor }}>No.</span>
            <span className="text-3xl font-black leading-none text-foreground">{banner.candidate_number}</span>
          </div>
        )}

        {/* Name + position + slogan overlay */}
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

        {/* Heart burst */}
        {likeBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-32 w-32 animate-ping fill-red-500 text-red-500 drop-shadow-2xl" />
          </div>
        )}

        {/* Floating like + share */}
        <div className="absolute right-3 bottom-3 flex flex-col gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md transition ${liked ? "bg-red-500 text-white" : "bg-white/90 text-foreground hover:bg-white"}`}
            aria-label="Like">
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-foreground backdrop-blur-md hover:bg-white"
            aria-label="Share">
            <Share2 className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          ❤ {(banner.likes_count || 0).toLocaleString()} likes
        </div>
      </div>

      {/* Action panel */}
      <div className="bg-card p-6 sm:p-8">

        {/* ===== BOOST BUTTON (Rocket) — matches Events page style ===== */}
        <Button
          size="lg"
          onClick={onBoost}
          className="group relative w-full overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-lg hover:shadow-2xl hover:scale-[1.01] transition-all"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
          <Rocket className="mr-2 h-5 w-5 animate-pulse" />
          <span className="font-bold">🚀 Boost this Campaign</span>
        </Button>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <div className="text-lg font-bold">{(banner.impressions || 0).toLocaleString()}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
              <Eye className="h-3 w-3" /> Views
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <div className="text-lg font-bold text-red-500">{(banner.likes_count || 0).toLocaleString()}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
              <Heart className="h-3 w-3" /> Likes
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
            <div className="text-lg font-bold">{(banner.votes_count || 0).toLocaleString()}</div>
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
              <Vote className="h-3 w-3" /> Votes
            </div>
          </div>
        </div>

        {/* Manifesto */}
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

        {/* Description */}
        {banner.description && (
          <RichText
            text={banner.description}
            className="mt-5 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground"
          />
        )}

        {/* CTA buttons */}
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

        {/* Social share row */}
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-5">
          <span className="text-xs font-medium text-muted-foreground">Sambaza kwa:</span>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="rounded-full p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" aria-label="Share on WhatsApp">
            <MessageCircle className="h-4 w-4" />
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="rounded-full p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950" aria-label="Share on X">
            <Twitter className="h-4 w-4" />
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
            className="rounded-full p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950" aria-label="Share on Facebook">
            <Facebook className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Bottom party band */}
      <div className="h-2" style={{ background: partyColor }} />
    </div>
  );
};

// =================== STANDARD LAYOUT ===================
const StandardLayout = ({ banner, meta, Icon, imageUrl, images, currentImageIndex, setCurrentImageIndex, onShare, onClick, onOpenImage, liked, likeBurst, onLike, onDoubleTap }: any) => {
  const hasExternalLink = !!banner.target_url && !banner.target_url.includes("kenyaadverts.com/banners");
  return (
    <Card className="overflow-hidden">
      <div onDoubleClick={onDoubleTap} className="relative block w-full overflow-hidden bg-gradient-to-b from-muted/40 to-muted/10">
        <button type="button" onClick={onOpenImage}
          className="group flex w-full items-center justify-center bg-black/5 dark:bg-black/40"
          aria-label="View full banner" style={{ minHeight: "300px" }}>
          <img src={optimizeImageUrl(imageUrl, 1400)} alt={banner.business_name}
            className="max-h-[70vh] w-full object-contain transition-transform duration-500 group-hover:scale-[1.01]" />
        </button>
        {likeBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Heart className="h-24 w-24 animate-ping fill-red-500 text-red-500" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <span className="pointer-events-auto rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            ❤ {(banner.likes_count || 0).toLocaleString()}
          </span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onLike(); }}
            className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition ${liked ? "bg-red-500 text-white" : "bg-white/95 text-foreground hover:bg-white"}`}
            aria-label="Like">
            <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-7 md:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${meta.badgeClass}`}>
            <Icon className="h-3 w-3" /> {meta.label}
          </span>
          <button type="button" onClick={onLike}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${liked ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            aria-label="Like">
            <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} /> {(banner.likes_count || 0).toLocaleString()} {liked ? "liked" : "likes"}
          </button>
          {(banner.impressions || 0) > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              <Eye className="h-3 w-3" /> {(banner.impressions || 0).toLocaleString()} views
            </span>
          )}
        </div>

        <div>
          <h1 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {banner.business_name}
          </h1>
          {banner.description && (
            <RichText text={banner.description} className="mt-3 text-[15px] leading-relaxed text-muted-foreground md:text-base" />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Help {banner.business_name} reach more Kenyans
          </p>
          <div className="flex items-center justify-center gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(`${banner.business_name} on KenyaAdvert ${typeof window !== "undefined" ? window.location.origin : ""}/share/banner/${banner.slug || banner.id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition hover:scale-105 hover:bg-emerald-600" aria-label="Share on WhatsApp">
              <MessageCircle className="h-5 w-5" />
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/share/banner/${banner.slug || banner.id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:scale-105 hover:bg-blue-700" aria-label="Share on Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(banner.business_name + " on KenyaAdvert")}&url=${encodeURIComponent(`${typeof window !== "undefined" ? window.location.origin : ""}/share/banner/${banner.slug || banner.id}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm transition hover:scale-105 hover:bg-sky-600" aria-label="Share on X">
              <Twitter className="h-5 w-5" />
            </a>
            <button type="button" onClick={onShare}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition hover:scale-105" aria-label="More share options">
              <Share2 className="h-5 w-5" />
            </button>
            {hasExternalLink && (
              <a href={banner.target_url} target="_blank" rel="noopener noreferrer" onClick={onClick}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:scale-105" aria-label="Visit website">
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Posted on <Link to="/banners" className="font-semibold text-primary hover:underline">KenyaAdvert Banners</Link> — Kenya's free promo showcase. Want your own?{" "}
          <Link to="/banners/new" className="font-semibold text-primary hover:underline">Create one free →</Link>
        </p>
      </div>
    </Card>
  );
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Vote; badgeClass: string }> = {
  politician: { label: "Politician", icon: Vote,           badgeClass: "bg-primary text-primary-foreground" },
  business:   { label: "Business",   icon: Briefcase,      badgeClass: "bg-blue-500/95 text-white" },
  event:      { label: "Event",      icon: CalendarHeart,  badgeClass: "bg-pink-500/95 text-white" },
  ngo:        { label: "NGO",        icon: HeartHandshake, badgeClass: "bg-emerald-500/95 text-white" },
  other:      { label: "Promo",      icon: Sparkles,       badgeClass: "bg-amber-500/95 text-white" },
};

export default BannerDetailsPage;
