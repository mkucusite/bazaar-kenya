import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import { PREMIUM_ADS, LATEST_ADS, type Ad } from "@/data/mockData";
import {
  MapPin,
  Calendar,
  Eye,
  Phone,
  MessageCircle,
  MessageSquare,
  Heart,
  Share2,
  ChevronRight,
  Shield,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getAdAbsoluteUrl, getAdPath, getShareSnippet } from "@/lib/ad-links";

const ALL_ADS = [...PREMIUM_ADS, ...LATEST_ADS];

type AdRecord = Tables<"ads">;

const toCardAd = (ad: AdRecord): Ad => ({
  id: ad.id,
  title: ad.title,
  price: Number(ad.price || 0),
  location: ad.town ? `${ad.town}, ${ad.county}` : ad.county,
  county: ad.county,
  image: ad.images?.[0] || "/placeholder.svg",
  category: "Listings",
  date: ad.created_at || new Date().toISOString(),
  badge: (ad.badge as "gold" | "silver" | undefined) || undefined,
  condition: (ad.condition as "New" | "Used" | "Refurbished" | undefined) || undefined,
  phone: ad.phone,
  whatsapp: ad.whatsapp || undefined,
  views: ad.views_count || 0,
});

const AdDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const fromMyAds = Boolean((location.state as { fromMyAds?: boolean } | null)?.fromMyAds);

  const normalizedId = useMemo(() => {
    if (!id) return "";

    const match = id.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    return match?.[0] || id;
  }, [id]);

  const [dbAd, setDbAd] = useState<AdRecord | null>(null);
  const [similarDbAds, setSimilarDbAds] = useState<AdRecord[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const mockAd = useMemo(() => ALL_ADS.find((a) => a.id === normalizedId), [normalizedId]);

  useEffect(() => {
    const fetchAd = async () => {
      if (!normalizedId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase.from("ads").select("*").eq("id", normalizedId).maybeSingle();

      if (data) {
        setDbAd(data);

        const { data: similar } = await supabase
          .from("ads")
          .select("*")
          .neq("id", data.id)
          .eq("status", "active")
          .or(`county.eq.${data.county},badge.eq.gold,badge.eq.silver`)
          .order("created_at", { ascending: false })
          .limit(4);

        setSimilarDbAds((similar as AdRecord[]) || []);
      } else {
        setDbAd(null);
        setSimilarDbAds([]);
      }

      setLoading(false);
    };

    fetchAd();
  }, [normalizedId]);

  useEffect(() => {
    setCurrentImage(0);
  }, [dbAd?.id, mockAd?.id]);

  const activeAd = dbAd
    ? {
        id: dbAd.id,
        title: dbAd.title,
        description: dbAd.description || "",
        county: dbAd.county,
        town: dbAd.town || "",
        price: Number(dbAd.price || 0),
        condition: dbAd.condition || "Not specified",
        badge: dbAd.badge || "standard",
        phone: dbAd.phone,
        whatsapp: dbAd.whatsapp || dbAd.phone,
        views: dbAd.views_count || 0,
        date: dbAd.created_at,
        images: dbAd.images && dbAd.images.length > 0 ? dbAd.images : ["/placeholder.svg"],
        categoryLabel: "Listings",
      }
    : mockAd
      ? {
          id: mockAd.id,
          title: mockAd.title,
          description: `This is a listing for ${mockAd.title}. Located in ${mockAd.location}, ${mockAd.county}. Contact the seller for more details about this item. Condition: ${mockAd.condition || "Not specified"}.`,
          county: mockAd.county,
          town: mockAd.location,
          price: mockAd.price,
          condition: mockAd.condition || "Not specified",
          badge: mockAd.badge || "standard",
          phone: mockAd.phone,
          whatsapp: mockAd.whatsapp || mockAd.phone,
          views: mockAd.views,
          date: mockAd.date,
          images: [mockAd.image, mockAd.image, mockAd.image],
          categoryLabel: mockAd.category,
        }
      : null;

  const similarAds = dbAd
    ? similarDbAds.map(toCardAd)
    : ALL_ADS.filter((a) => mockAd && a.category === mockAd.category && a.id !== mockAd.id).slice(0, 4);

  const liveUrl = activeAd ? getAdAbsoluteUrl({ id: activeAd.id, title: activeAd.title }) : "";
  const shareDescription = activeAd ? getShareSnippet(activeAd.description) : "";
  const shareImage = activeAd?.images?.[0] || "/placeholder.svg";
  const shareText = [activeAd?.title, shareDescription, shareImage ? `Image: ${shareImage}` : ""].filter(Boolean).join("\n");

  useEffect(() => {
    if (!activeAd) return;

    document.title = `${activeAd.title} | KenyaAdvert`;

    const updateMeta = (selector: string, attribute: "name" | "property", value: string) => {
      let tag = document.querySelector<HTMLMetaElement>(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(
          attribute,
          selector.includes("og:")
            ? selector.replace('meta[property="', "").replace('"]', "")
            : selector.replace('meta[name="', "").replace('"]', ""),
        );
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", value);
    };

    updateMeta('meta[property="og:title"]', "property", activeAd.title);
    updateMeta('meta[property="og:description"]', "property", shareDescription || activeAd.title);
    updateMeta('meta[property="og:image"]', "property", shareImage);
    updateMeta('meta[property="og:url"]', "property", liveUrl);
    updateMeta('meta[name="twitter:card"]', "name", "summary_large_image");
    updateMeta('meta[name="twitter:title"]', "name", activeAd.title);
    updateMeta('meta[name="twitter:description"]', "name", shareDescription || activeAd.title);
    updateMeta('meta[name="twitter:image"]', "name", shareImage);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", liveUrl);
  }, [activeAd, liveUrl, shareDescription, shareImage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!activeAd) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Ad Not Found</h1>
          <p className="text-muted-foreground text-sm mb-4">This listing may have been removed.</p>
          <Link to={fromMyAds ? "/my-ads" : "/"}>
            <Button>{fromMyAds ? "Back to My Ads" : "Back to Home"}</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCall = () => {
    window.open(`tel:${activeAd.phone}`);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${activeAd.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`${shareText}\n${liveUrl}`)}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: activeAd.title, text: shareText, url: liveUrl });
        return;
      } catch {
        // fallback below
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${liveUrl}`.trim());
    toast({ title: "Share details copied" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-4">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-5 flex-wrap">
          <Link to={fromMyAds ? "/my-ads" : "/"} className="hover:text-primary transition-colors">
            {fromMyAds ? "My Ads" : "Home"}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/search?category=${encodeURIComponent(activeAd.categoryLabel)}`} className="hover:text-primary transition-colors">
            {activeAd.categoryLabel}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{activeAd.title}</span>
        </nav>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden border border-border/60 mb-3 aspect-[4/3] bg-muted">
              <img src={activeAd.images[currentImage]} alt={activeAd.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {activeAd.images.map((img, i) => (
                <button
                  key={`${activeAd.id}-${i}`}
                  onClick={() => setCurrentImage(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                    i === currentImage ? "border-primary" : "border-border/60"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="font-heading font-semibold text-base text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{activeAd.description || "No description provided."}</p>
            </div>

            <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-xs text-foreground">Safety Tips</h3>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>- Meet in a public place for the transaction</li>
                <li>- Never pay before seeing the item</li>
                <li>- Beware of deals that seem too good to be true</li>
                <li>- Use M-Pesa for secure payments</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border/60 p-5">
              {activeAd.badge && (
                <span
                  className={`inline-block mb-3 ${activeAd.badge === "gold" ? "gold-badge" : activeAd.badge === "silver" ? "silver-badge" : "badge-used"}`}
                >
                  {activeAd.badge.toUpperCase()}
                </span>
              )}

              <h1 className="font-heading font-bold text-lg text-foreground mb-2 leading-snug">{activeAd.title}</h1>
              <p className="text-2xl font-bold text-primary mb-2">{activeAd.price > 0 ? `KSh ${activeAd.price.toLocaleString()}` : "Contact for Price"}</p>

              {activeAd.condition && (
                <span className="inline-block px-2 py-0.5 bg-muted text-muted-foreground text-[11px] font-medium rounded mb-3">{activeAd.condition}</span>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mb-5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {activeAd.town ? `${activeAd.town}, ${activeAd.county}` : activeAd.county}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(activeAd.date || Date.now()).toLocaleDateString("en-KE")}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {activeAd.views} views
                </span>
              </div>

              <div className="space-y-2">
                <Button onClick={handleCall} variant="outline" className="w-full justify-center gap-2 h-10">
                  <Phone className="w-4 h-4" /> Call Seller
                </Button>
                <Button onClick={handleWhatsApp} className="w-full justify-center gap-2 h-10 bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                <Button variant="secondary" className="w-full justify-center gap-2 h-10">
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={() => {
                    setSaved(!saved);
                    toast({ title: saved ? "Removed" : "Saved to favourites" });
                  }}
                >
                  <Heart className={`w-4 h-4 mr-1 ${saved ? "fill-destructive text-destructive" : ""}`} /> {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 h-9">
              <AlertTriangle className="w-4 h-4 mr-1" /> Report This Ad
            </Button>
          </div>
        </div>

        {similarAds.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading font-bold text-lg text-foreground mb-5">Similar Ads</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {similarAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        )}

        {dbAd && (
          <div className="mt-6 text-xs text-muted-foreground">
            Link: <Link to={getAdPath({ id: dbAd.id, title: dbAd.title })} className="text-primary underline">{getAdPath({ id: dbAd.id, title: dbAd.title })}</Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdDetailsPage;
