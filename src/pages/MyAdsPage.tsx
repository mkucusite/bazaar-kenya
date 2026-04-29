import { useCallback, useEffect, useMemo, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Loader2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MyAdCard from "@/components/my-ads/MyAdCard";
import EditAdDialog from "@/components/my-ads/EditAdDialog";
import BoostDialog from "@/components/my-ads/BoostDialog";
import { sortAdsByPriority, formatAdPrice, getPrimaryImage, badgeStyles, type ManagedAd, type ManagedAdUpdate } from "@/components/my-ads/types";
import { getAdPath, getAdShareUrl, getShareSnippet } from "@/lib/ad-links";

const PAGE_SIZE = 12;

type StatusFilter = "all" | "active" | "inactive";

const MyAdsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight") || "";

  const [ads, setAds] = useState<ManagedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingAd, setEditingAd] = useState<ManagedAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Boost dialog state
  const [boostAd, setBoostAd] = useState<ManagedAd | null>(null);
  const [boostTier, setBoostTier] = useState<"silver" | "gold">("silver");

  const fetchAds = useCallback(
    async (isInitial = false) => {
      if (!user) return;
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Failed to load ads", description: error.message, variant: "destructive" });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setAds((data || []) as ManagedAd[]);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAds(true);
  }, [user, authLoading, navigate, fetchAds]);

  // Recently published ads (newest first, no badge priority)
  const recentAds = useMemo(() => {
    let result = [...ads];
    if (statusFilter === "active") result = result.filter((ad) => ad.status === "active");
    else if (statusFilter === "inactive") result = result.filter((ad) => ad.status !== "active");
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((ad) =>
        [ad.title, ad.description, ad.county, ad.town].filter(Boolean).some((v) => v!.toLowerCase().includes(term)),
      );
    }
    return result;
  }, [ads, search, statusFilter]);

  // Boosted ads for the side panel
  const boostedAds = useMemo(() => ads.filter((ad) => ad.badge === "gold" || ad.badge === "silver"), [ads]);

  const visibleAds = useMemo(() => recentAds.slice(0, visibleCount), [recentAds, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter]);

  useEffect(() => {
    if (highlightId) {
      setSearchParams((params) => {
        params.delete("highlight");
        return params;
      });
    }
  }, [highlightId, setSearchParams]);

  const handleRefresh = async () => {
    await fetchAds();
  };

  const buildShareText = (ad: ManagedAd) => {
    const snippet = getShareSnippet(ad.description);
    return [ad.title, snippet].filter(Boolean).join("\n");
  };

  const handleViewLive = (ad: ManagedAd) => {
    navigate(getAdPath({ id: ad.id, title: ad.title }), { state: { fromMyAds: true } });
  };

  const handleShareCopy = async (ad: ManagedAd) => {
    const url = getAdShareUrl({ id: ad.id, title: ad.title, slug: ad.slug });
    const text = buildShareText(ad);
    if (navigator.share) {
      try { await navigator.share({ title: ad.title, text, url }); return; } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`.trim());
      toast({ title: "Share details copied" });
    } catch {
      toast({ title: "Share failed", variant: "destructive" });
    }
  };

  const handleDelete = async (ad: ManagedAd) => {
    if (!confirm(`Delete "${ad.title}"?`)) return;
    const { error } = await supabase.from("ads").delete().eq("id", ad.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setAds((prev) => prev.filter((item) => item.id !== ad.id));
    toast({ title: "Ad deleted" });
  };

  const handleBoost = (ad: ManagedAd, tier: "silver" | "gold") => {
    setBoostAd(ad);
    setBoostTier(tier);
  };

  const handleBoosted = (updated: ManagedAd) => {
    setAds((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setBoostAd(null);
  };

  const handleSaveEdit = async (id: string, payload: ManagedAdUpdate) => {
    setSaving(true);
    const { data, error } = await supabase.from("ads").update(payload).eq("id", id).select().single();
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    const updated = data as ManagedAd;
    setAds((prev) => prev.map((item) => (item.id === id ? updated : item)));
    setEditingAd(null);
    toast({ title: "Ad updated" });
  };

  const totalViews = ads.reduce((sum, ad) => sum + (ad.views_count || 0), 0);
  const activeCount = ads.filter((ad) => ad.status === "active").length;
  const inactiveCount = ads.length - activeCount;

  const statusFilters: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: ads.length },
    { key: "active", label: "Active", count: activeCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Manage My Ads — KenyaAdvert Dashboard" description="Manage, edit, boost and track your classified ads on KenyaAdvert. View performance and renew listings." canonical="https://www.kenyaadverts.co.ke/my-ads" keywords="manage ads, my ads, ad dashboard, KenyaAdvert" />
      <Navbar />
      <div className="container-app py-6">
        {/* Header */}
        <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Manage My Ads</h1>
              <p className="text-sm text-muted-foreground">Recently published ads appear first.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleRefresh} className="h-10" disabled={refreshing || loading}>
                <RefreshCcw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button onClick={() => navigate("/post-ad")} className="h-10">
                <Plus className="w-4 h-4 mr-1.5" /> Post Ad
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Listings</p>
              <p className="text-2xl font-bold text-foreground">{ads.length}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Views</p>
              <p className="text-2xl font-bold text-foreground">{totalViews}</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {statusFilters.map((f) => (
            <Button
              key={f.key}
              variant={statusFilter === f.key ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label} ({f.count})
            </Button>
          ))}
        </div>

        <div className="mb-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your ads…"
            className="h-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : recentAds.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No ads to show</h3>
            <p className="text-muted-foreground text-sm mb-6">Post an ad or adjust your search</p>
            <Button onClick={() => navigate("/post-ad")} className="h-10">
              <Plus className="w-4 h-4 mr-1.5" /> Post your first ad
            </Button>
          </div>
        ) : (
          <div className="xl:grid xl:grid-cols-5 gap-6">
            {/* Main ad list */}
            <div className="xl:col-span-3 space-y-3">
              {visibleAds.map((ad) => (
                <MyAdCard
                  key={ad.id}
                  ad={ad}
                  selected={highlightId === ad.id}
                  onSelect={handleViewLive}
                  onViewLive={handleViewLive}
                  onShare={handleShareCopy}
                  onEdit={setEditingAd}
                  onDelete={handleDelete}
                  onBoost={handleBoost}
                />
              ))}
              {visibleCount < recentAds.length && (
                <Button variant="outline" className="w-full h-10" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Load more ads
                </Button>
              )}
            </div>

            {/* Boosted ads sidebar (desktop) */}
            <div className="hidden xl:block xl:col-span-2">
              <div className="sticky top-20 space-y-4">
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-yellow-500" /> Boosted Ads
                  </h3>
                  {boostedAds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No boosted ads yet. Upgrade an ad to get more visibility!</p>
                  ) : (
                    <div className="space-y-3">
                      {boostedAds.map((ad) => (
                        <div
                          key={ad.id}
                          onClick={() => handleViewLive(ad)}
                          className="flex gap-3 p-2 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors"
                        >
                          <img
                            src={getPrimaryImage(ad)}
                            alt={ad.title}
                            className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{ad.title}</p>
                            <p className="text-xs text-primary font-semibold">{formatAdPrice(ad.price)}</p>
                            <span className={badgeStyles[ad.badge || "standard"] || badgeStyles.standard}>
                              {ad.badge}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <EditAdDialog
        open={Boolean(editingAd)}
        ad={editingAd}
        saving={saving}
        onOpenChange={(open) => !open && setEditingAd(null)}
        onSave={handleSaveEdit}
      />

      <BoostDialog
        open={Boolean(boostAd)}
        ad={boostAd}
        tier={boostTier}
        onOpenChange={(open) => !open && setBoostAd(null)}
        onBoosted={handleBoosted}
      />

      <Footer />
    </div>
  );
};

export default MyAdsPage;
