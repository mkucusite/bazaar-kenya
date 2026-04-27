import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, Loader2, Share2, ThumbsUp, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";

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
      // Try slug first then id
      let { data } = await supabase.from("banner_campaigns" as any).select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await supabase.from("banner_campaigns" as any).select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      if (mounted) {
        setBanner(data as any);
        setLoading(false);
        if (data) {
          // Track impression
          supabase.rpc("increment_banner_impressions", { campaign_id: (data as any).id } as any);
          // Check vote
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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${banner.business_name} | KenyaAdvert Banner`}
        description={(banner.description || `Support ${banner.business_name} — view, vote and share`).slice(0, 160)}
        canonical={`https://www.kenyaadverts.co.ke/banners/${banner.slug || banner.id}`}
        ogImage={banner.banner_image}
      />
      <Navbar />

      <main className="container-app max-w-3xl py-6 md:py-10">
        <Card className="overflow-hidden">
          <div className="aspect-[3/1] w-full overflow-hidden bg-muted">
            <img src={banner.banner_image} alt={banner.business_name} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                {banner.category && (
                  <span className="mb-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                    {banner.category}
                  </span>
                )}
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{banner.business_name}</h1>
              </div>
            </div>

            {banner.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{banner.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<ThumbsUp className="h-4 w-4" />} label="Votes" value={banner.votes_count} highlight={banner.is_voting_enabled} />
              <Stat icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={banner.clicks} />
              <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={banner.impressions} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {banner.is_voting_enabled && (
                <Button size="lg" className="flex-1" disabled={hasVoted || voting} onClick={vote}>
                  {voting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                  {hasVoted ? "Voted" : "Vote"}
                </Button>
              )}
              <Button asChild size="lg" variant={banner.is_voting_enabled ? "outline" : "default"} className="flex-1" onClick={handleClick}>
                <a href={banner.target_url} target="_blank" rel="noopener noreferrer">
                  Visit <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" onClick={share}>
                <Share2 className="mr-2 h-4 w-4" />Share
              </Button>
            </div>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

const Stat = ({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) => (
  <div className={`rounded-xl border p-3 text-center ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
    <div className="mb-1 flex justify-center text-muted-foreground">{icon}</div>
    <div className="text-lg font-bold">{value.toLocaleString()}</div>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
  </div>
);

export default BannerDetailsPage;
