import { useEffect, useMemo, useState } from "react";
import { optimizeImageUrl } from "@/lib/image-utils";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import SEOHead from "@/components/SEOHead";
import { PREMIUM_ADS, LATEST_ADS } from "@/data/mockData";
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
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { getAdAbsoluteUrl, getAdPath, getAdShareUrl, getShareSnippet } from "@/lib/ad-links";
import { mapDbAdToCard } from "@/lib/ad-mappers";

const ALL_ADS = [...PREMIUM_ADS, ...LATEST_ADS];

type AdRecord = Tables<"ads">;

const AdDetailsPage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromMyAds =
    Boolean((location.state as { fromMyAds?: boolean } | null)?.fromMyAds) ||
    new URLSearchParams(location.search).get("from") === "my-ads";

  const [dbAd, setDbAd] = useState<AdRecord | null>(null);
  const [similarDbAds, setSimilarDbAds] = useState<AdRecord[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; rating: number; body: string; user_id: string | null; guest_name: string | null; parent_id: string | null; created_at: string }[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [userReviewBody, setUserReviewBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyGuestName, setReplyGuestName] = useState("");

  // Try to find by slug first, fallback to UUID for backward compatibility
  const isUuid = useMemo(
    () => !!slug?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
    [slug],
  );

  const mockAd = useMemo(() => ALL_ADS.find((a) => a.id === slug), [slug]);

  useEffect(() => {
    const fetchAd = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Look up by slug, or by id for backward compatibility
      const query = isUuid
        ? supabase.from("ads").select("*").eq("id", slug).maybeSingle()
        : supabase.from("ads").select("*").eq("slug", slug as any).maybeSingle();

      const { data } = await query;

      if (data) {
        setDbAd(data);

        // Redirect old UUID URLs to slug URLs
        if (isUuid && (data as any).slug) {
          navigate(`/ads/${(data as any).slug}`, { replace: true });
          return;
        }

        // Increment view count via server-side function (works for public visitors too)
        void (async () => {
          const { error } = await supabase.rpc("increment_ad_views", { target_ad_id: data.id });
          if (error) console.error("increment_ad_views failed", error);
        })();

        const categoryPromise = data.category_id
          ? supabase
              .from("ads")
              .select("*")
              .neq("id", data.id)
              .eq("status", "active")
              .eq("category_id", data.category_id)
              .order("created_at", { ascending: false })
              .limit(8)
          : Promise.resolve({ data: [] as AdRecord[] });

        const countyPromise = supabase
          .from("ads")
          .select("*")
          .neq("id", data.id)
          .eq("status", "active")
          .eq("county", data.county)
          .order("created_at", { ascending: false })
          .limit(8);

        const reviewsPromise = supabase
          .from("reviews")
          .select("id, rating, body, user_id, guest_name, parent_id, created_at")
          .eq("ad_id", data.id)
          .order("created_at", { ascending: false });

        const [{ data: sameCat }, { data: byCounty }, { data: reviewData }] = await Promise.all([
          categoryPromise,
          countyPromise,
          reviewsPromise,
        ]);

        const similarRows: AdRecord[] = [...(((sameCat as AdRecord[]) || []))];
        const seen = new Set(similarRows.map((row) => row.id));

        for (const row of ((byCounty as AdRecord[]) || [])) {
          if (!seen.has(row.id)) {
            similarRows.push(row);
            seen.add(row.id);
          }

          if (similarRows.length >= 4) break;
        }

        setSimilarDbAds(similarRows.slice(0, 4));
        setReviews((reviewData as any[]) || []);
      } else {
        setDbAd(null);
        setSimilarDbAds([]);
      }

      setLoading(false);
    };

    fetchAd();
  }, [slug, isUuid, navigate]);

  useEffect(() => {
    setCurrentImage(0);
  }, [dbAd?.id, mockAd?.id]);

  // Check if this ad is saved as a fav
  useEffect(() => {
    if (!user || !dbAd?.id) return;
    supabase
      .from("favourites")
      .select("id")
      .eq("user_id", user.id)
      .eq("ad_id", dbAd.id)
      .maybeSingle()
      .then(({ data }) => setSaved(Boolean(data)));
  }, [user, dbAd?.id]);

  const activeAd = dbAd
    ? {
        id: dbAd.id,
        title: dbAd.title,
        slug: (dbAd as any).slug as string | undefined,
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
      }
    : mockAd
      ? {
          id: mockAd.id,
          title: mockAd.title,
          slug: mockAd.slug,
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
        }
      : null;

  const similarAds = dbAd
    ? similarDbAds.map(mapDbAdToCard)
    : ALL_ADS.filter((a) => mockAd && a.id !== mockAd.id).slice(0, 4);

  const liveUrl = activeAd ? getAdAbsoluteUrl({ id: activeAd.id, title: activeAd.title, slug: activeAd.slug }) : "";
  const shareUrl = activeAd ? getAdShareUrl({ id: activeAd.id, title: activeAd.title, slug: activeAd.slug }) : "";
  const shareDescription = activeAd ? getShareSnippet(activeAd.description) : "";
  const shareText = [activeAd?.title, shareDescription].filter(Boolean).join("\n");

  useEffect(() => {
    if (!activeAd) return;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: activeAd.title,
      description: activeAd.description || activeAd.title,
      image: activeAd.images?.filter(img => img !== "/placeholder.svg") || [],
      url: liveUrl,
      brand: {
        "@type": "Brand",
        name: "KenyaAdvert Marketplace",
      },
      category: "Classifieds",
      sku: activeAd.id,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (() => {
          const rated = reviews.filter((r) => r.rating != null);
          return rated.length > 0
            ? (rated.reduce((sum, r) => sum + (r.rating || 0), 0) / rated.length).toFixed(1)
            : "4.5";
        })(),
        reviewCount: reviews.filter((r) => r.rating != null).length > 0
          ? reviews.filter((r) => r.rating != null).length.toString()
          : "1",
        bestRating: "5",
        worstRating: "1",
      },
      review: reviews.filter((r) => r.rating != null).length > 0
        ? reviews.filter((r) => r.rating != null).slice(0, 5).map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: (r.rating || 5).toString(),
              bestRating: "5",
            },
            author: { "@type": "Person", name: r.guest_name || "KenyaAdvert Buyer" },
            reviewBody: r.body,
          }))
        : [{
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "4.5",
              bestRating: "5",
            },
            author: { "@type": "Organization", name: "KenyaAdvert" },
            reviewBody: "Listed and verified on KenyaAdvert marketplace.",
          }],
      offers: {
        "@type": "Offer",
        price: activeAd.price > 0 ? activeAd.price.toString() : "0",
        priceCurrency: "KES",
        priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        availability: "https://schema.org/InStock",
        itemCondition:
          activeAd.condition === "New"
            ? "https://schema.org/NewCondition"
            : activeAd.condition === "Refurbished"
              ? "https://schema.org/RefurbishedCondition"
              : "https://schema.org/UsedCondition",
        seller: {
          "@type": "Organization",
          name: "KenyaAdvert Seller",
        },
        areaServed: {
          "@type": "Place",
          name: `${activeAd.town ? activeAd.town + ", " : ""}${activeAd.county}, Kenya`,
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "KES" },
          shippingDestination: { "@type": "DefinedRegion", addressCountry: "KE" },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 7, unitCode: "DAY" },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: { "@type": "Country", name: "KE" },
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 7,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
      },
    };

    let script = document.querySelector<HTMLScriptElement>('script[data-jsonld="ad"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-jsonld", "ad");
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(jsonLd);

    return () => {
      const el = document.querySelector('script[data-jsonld="ad"]');
      el?.remove();
    };
  }, [activeAd, liveUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container-app flex-1 py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!activeAd) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center flex-1">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Ad Not Found</h1>
          <p className="text-muted-foreground text-sm mb-4">This listing may have been removed.</p>
          <Link to={fromMyAds ? "/my-ads" : "/search"}>
            <Button>{fromMyAds ? "Back to My Ads" : "Back to Browse"}</Button>
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
    const raw = activeAd.whatsapp.replace(/[^0-9]/g, "");
    const waPhone = raw.startsWith("0") ? "254" + raw.slice(1) : raw.startsWith("254") ? raw : "254" + raw;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi, I'm interested in "${activeAd.title}" on KenyaAdvert\n${shareUrl}`)}`);
  };

  const handleChat = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!dbAd) {
      toast({ title: "Chat not available for this listing" });
      return;
    }

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("ad_id", dbAd.id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (existing) {
      navigate("/chats");
      return;
    }

    // Create new conversation
    const { error } = await supabase.from("conversations").insert({
      ad_id: dbAd.id,
      buyer_id: user.id,
      seller_id: dbAd.user_id,
    });

    if (error) {
      toast({ title: "Could not start chat", description: error.message, variant: "destructive" });
      return;
    }

    navigate("/chats");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: activeAd.title, text: shareText, url: shareUrl });
        return;
      } catch {
        // fallback below
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`.trim());
    toast({ title: "Link copied" });
  };

  const handleToggleSave = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (saved) {
      await supabase.from("favourites").delete().eq("user_id", user.id).eq("ad_id", activeAd.id);
      setSaved(false);
      toast({ title: "Removed from favourites" });
    } else {
      await supabase.from("favourites").insert({ user_id: user.id, ad_id: activeAd.id });
      setSaved(true);
      toast({ title: "Saved to favourites" });
    }
  };

  const refetchReviews = async () => {
    if (!dbAd) return;
    const { data } = await (supabase as any)
      .from("reviews")
      .select("id, rating, body, user_id, guest_name, parent_id, created_at")
      .eq("ad_id", dbAd.id)
      .order("created_at", { ascending: false });
    setReviews((data as any[]) || []);
  };

  const handleSubmitReview = async () => {
    if (!dbAd) return;
    if (userRating === 0) { toast({ title: "Please select a star rating", variant: "destructive" }); return; }
    if (!userReviewBody.trim()) { toast({ title: "Please write a review", variant: "destructive" }); return; }
    if (!user && !guestName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return; }

    setSubmittingReview(true);
    const { error } = await (supabase as any).from("reviews").insert({
      ad_id: dbAd.id,
      user_id: user?.id || null,
      guest_name: user ? null : guestName.trim(),
      rating: userRating,
      body: userReviewBody.trim(),
      parent_id: null,
    });

    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted! Thank you." });
      await refetchReviews();
      setUserRating(0);
      setUserReviewBody("");
      setGuestName("");
      setShowReviewForm(false);
    }
    setSubmittingReview(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!dbAd) return;
    if (!replyBody.trim()) { toast({ title: "Please write a reply", variant: "destructive" }); return; }
    if (!user && !replyGuestName.trim()) { toast({ title: "Please enter your name", variant: "destructive" }); return; }

    setSubmittingReview(true);
    const { error } = await (supabase as any).from("reviews").insert({
      ad_id: dbAd.id,
      user_id: user?.id || null,
      guest_name: user ? null : replyGuestName.trim(),
      rating: null,
      body: replyBody.trim(),
      parent_id: parentId,
    });

    if (error) {
      toast({ title: "Failed to reply", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reply posted!" });
      await refetchReviews();
      setReplyBody("");
      setReplyGuestName("");
      setReplyingTo(null);
    }
    setSubmittingReview(false);
  };

  const handleReport = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!reportReason.trim()) {
      toast({ title: "Please enter a reason", variant: "destructive" });
      return;
    }

    setReporting(true);
    try {
      const { data: report, error } = await supabase
        .from("ad_reports")
        .insert({ ad_id: activeAd.id, reporter_id: user.id, reason: reportReason.trim() })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({ title: "You've already reported this ad" });
        } else {
          throw error;
        }
        setReporting(false);
        setShowReportForm(false);
        return;
      }

      // trigger AI moderation in background
      supabase.functions.invoke("moderate-reported-ad", { body: { report_id: report.id } }).catch(() => {});

      toast({ title: "Report submitted", description: "We'll review this ad shortly." });
      setShowReportForm(false);
      setReportReason("");
    } catch (err: any) {
      toast({ title: "Report failed", description: err.message, variant: "destructive" });
    }
    setReporting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={activeAd.title}
        description={shareDescription || `${activeAd.title} for ${activeAd.price > 0 ? `KSh ${activeAd.price.toLocaleString()}` : "sale"} in ${activeAd.town ? `${activeAd.town}, ` : ""}${activeAd.county}, Kenya. Buy safely on KenyaAdvert.`}
        canonical={liveUrl}
        ogImage={activeAd.images?.[0] || `${window.location.origin}/placeholder.svg`}
        keywords={`${activeAd.title}, ${activeAd.county}, Kenya classifieds, buy and sell Kenya, ${activeAd.county} marketplace, second hand Kenya, used items ${activeAd.county}, cheap deals Kenya, trusted seller, KenyaAdvert listing, buy ${activeAd.title?.split(" ")[0]} Kenya`}
        price={activeAd.price}
        condition={activeAd.condition?.toLowerCase()}
        adLocation={activeAd.town ? `${activeAd.town}, ${activeAd.county}` : activeAd.county}
      />
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-4 flex-1">
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-5 flex-wrap">
          <Link to={fromMyAds ? "/my-ads" : "/search"} className="hover:text-primary transition-colors">
            {fromMyAds ? "My Ads" : "Browse Ads"}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate">{activeAd.title}</span>
        </nav>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-xl overflow-hidden border border-border/60 mb-3 aspect-[4/3] bg-muted">
              <OptimizedImage
                src={activeAd.images[currentImage]}
                alt={activeAd.title}
                width={800}
                height={600}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
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
                  <img src={optimizeImageUrl(img, 100, 80)} alt="" className="w-full h-full object-cover" loading="lazy" width={100} height={80} decoding="async" />
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

            {/* Reviews Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading font-semibold text-base text-foreground">
                  Reviews {reviews.filter(r => !r.parent_id).length > 0 && `(${reviews.filter(r => !r.parent_id).length})`}
                </h2>
                {dbAd && (!user || dbAd.user_id !== user.id) && (
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowReviewForm(!showReviewForm)}>
                    {showReviewForm ? "Cancel" : "Write a Review"}
                  </Button>
                )}
              </div>

              {showReviewForm && (
                <div className="bg-card border border-border/60 rounded-xl p-4 mb-4 space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setUserRating(star)} className="text-2xl transition-transform hover:scale-110">
                        <span className={star <= userRating ? "text-yellow-400" : "text-muted-foreground/30"}>★</span>
                      </button>
                    ))}
                  </div>
                  {!user && (
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                  <textarea
                    value={userReviewBody}
                    onChange={(e) => setUserReviewBody(e.target.value)}
                    placeholder="Share your experience with this seller or item..."
                    className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <Button size="sm" onClick={handleSubmitReview} disabled={submittingReview} className="h-9">
                    {submittingReview ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                    Submit Review
                  </Button>
                </div>
              )}

              {reviews.filter(r => !r.parent_id).length === 0 ? (
                <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.filter(r => !r.parent_id).map((r) => {
                    const replies = reviews.filter(reply => reply.parent_id === r.id);
                    return (
                      <div key={r.id} className="bg-card border border-border/60 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{r.guest_name || "Buyer"}</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-xs ${star <= (r.rating || 0) ? "text-yellow-400" : "text-muted-foreground/30"}`}>★</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{r.body}</p>
                        <button
                          onClick={() => setReplyingTo(replyingTo === r.id ? null : r.id)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          {replyingTo === r.id ? "Cancel" : "Reply"}
                        </button>

                        {replyingTo === r.id && (
                          <div className="mt-3 space-y-2 pl-3 border-l-2 border-primary/30">
                            {!user && (
                              <input
                                type="text"
                                value={replyGuestName}
                                onChange={(e) => setReplyGuestName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                            )}
                            <textarea
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full h-16 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Button size="sm" onClick={() => handleSubmitReply(r.id)} disabled={submittingReview} className="h-8 text-xs">
                              {submittingReview ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                              Post Reply
                            </Button>
                          </div>
                        )}

                        {replies.length > 0 && (
                          <div className="mt-3 space-y-2 pl-3 border-l-2 border-border">
                            {replies.map((reply) => (
                              <div key={reply.id} className="bg-secondary/30 rounded-lg p-2.5">
                                <span className="text-xs font-medium text-foreground">{reply.guest_name || "Buyer"}</span>
                                <p className="text-xs text-muted-foreground mt-0.5">{reply.body}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border/60 p-5">
              {activeAd.badge && activeAd.badge !== "standard" && (
                <span
                  className={`inline-block mb-3 ${activeAd.badge === "gold" ? "gold-badge" : "silver-badge"}`}
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
                <Button variant="secondary" className="w-full justify-center gap-2 h-10" onClick={handleChat}>
                  <MessageSquare className="w-4 h-4" /> Chat
                </Button>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={handleToggleSave}
                >
                  <Heart className={`w-4 h-4 mr-1 ${saved ? "fill-destructive text-destructive" : ""}`} /> {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
              </div>
            </div>

            {/* Report ad (only for logged-in users who are not the owner) */}
            {user && dbAd && dbAd.user_id !== user.id && (
              <div>
                {showReportForm ? (
                  <div className="bg-card rounded-xl border border-destructive/20 p-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" /> Report This Ad
                    </h4>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Why are you reporting this ad?"
                      className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/20"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowReportForm(false)} className="h-9">Cancel</Button>
                      <Button size="sm" onClick={handleReport} disabled={reporting} className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {reporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                        Submit Report
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/5 h-9"
                    onClick={() => setShowReportForm(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" /> Report This Ad
                  </Button>
                )}
              </div>
            )}
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
      </div>
      <Footer />
    </div>
  );
};

export default AdDetailsPage;
