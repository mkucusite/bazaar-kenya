import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MyAdCard from "@/components/my-ads/MyAdCard";
import MyAdPreview from "@/components/my-ads/MyAdPreview";
import EditAdDialog from "@/components/my-ads/EditAdDialog";
import { sortAdsByPriority, type ManagedAd, type ManagedAdUpdate } from "@/components/my-ads/types";
import { getAdAbsoluteUrl, getAdPath, getShareSnippet } from "@/lib/ad-links";

const PAGE_SIZE = 12;

const MyAdsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight") || "";

  const [ads, setAds] = useState<ManagedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAd, setSelectedAd] = useState<ManagedAd | null>(null);
  const [editingAd, setEditingAd] = useState<ManagedAd | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileTab, setMobileTab] = useState<"list" | "preview">("list");

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

      const sorted = sortAdsByPriority((data || []) as ManagedAd[]);
      setAds(sorted);
      setLoading(false);
      setRefreshing(false);
    },
    [user],
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchAds(true);
  }, [user, navigate, fetchAds]);

  const filteredAds = useMemo(() => {
    if (!search.trim()) return ads;

    const term = search.toLowerCase();
    return ads.filter((ad) =>
      [ad.title, ad.description, ad.county, ad.town].filter(Boolean).some((value) => value!.toLowerCase().includes(term)),
    );
  }, [ads, search]);

  const visibleAds = useMemo(() => filteredAds.slice(0, visibleCount), [filteredAds, visibleCount]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  useEffect(() => {
    if (filteredAds.length === 0) {
      setSelectedAd(null);
      return;
    }

    if (highlightId) {
      const index = filteredAds.findIndex((ad) => ad.id === highlightId);
      if (index >= 0) {
        setSelectedAd(filteredAds[index]);
        setVisibleCount((count) => Math.max(count, index + 1));
        setSearchParams((params) => {
          params.delete("highlight");
          return params;
        });

        if (typeof window !== "undefined" && window.innerWidth < 1280) {
          setMobileTab("preview");
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
        return;
      }
    }

    if (!selectedAd || !filteredAds.some((ad) => ad.id === selectedAd.id)) {
      setSelectedAd(filteredAds[0]);
    }
  }, [filteredAds, selectedAd, highlightId, setSearchParams]);

  const handleRefresh = async () => {
    await fetchAds();
  };

  const handleSelectAd = (ad: ManagedAd) => {
    setSelectedAd(ad);

    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileTab("preview");
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const buildShareText = (ad: ManagedAd) => {
    const snippet = getShareSnippet(ad.description);
    return [ad.title, snippet].filter(Boolean).join("\n");
  };

  const handleViewLive = (ad: ManagedAd) => {
    navigate(`${getAdPath({ id: ad.id, title: ad.title })}?from=my-ads`, { state: { fromMyAds: true } });
  };

  const handleShareCopy = async (ad: ManagedAd) => {
    const url = getAdAbsoluteUrl({ id: ad.id, title: ad.title });
    const text = buildShareText(ad);

    if (navigator.share) {
      try {
        await navigator.share({ title: ad.title, text, url });
        return;
      } catch {
        // fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`.trim());
      toast({ title: "Share details copied" });
    } catch {
      toast({ title: "Share failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const handleShareWhatsApp = (ad: ManagedAd) => {
    const url = getAdAbsoluteUrl({ id: ad.id, title: ad.title });
    const text = encodeURIComponent(`${buildShareText(ad)}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleShareTwitter = (ad: ManagedAd) => {
    const url = encodeURIComponent(getAdAbsoluteUrl({ id: ad.id, title: ad.title }));
    const text = encodeURIComponent(buildShareText(ad));
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
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

  const handleBoost = async (ad: ManagedAd, tier: "silver" | "gold") => {
    // Navigate to credits page to pay for boost — don't auto-upgrade
    toast({ title: `To boost to ${tier}, complete payment first` });
    navigate(`/credits?boost=${tier}&ad=${ad.id}`);
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
    setAds((prev) => sortAdsByPriority(prev.map((item) => (item.id === id ? updated : item))));
    setSelectedAd(updated);
    setEditingAd(null);
    toast({ title: "Ad updated" });
  };

  const totalViews = ads.reduce((sum, ad) => sum + (ad.views_count || 0), 0);
  const activeCount = ads.filter((ad) => ad.status === "active").length;
  const boostedCount = ads.filter((ad) => ad.badge === "gold" || ad.badge === "silver").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-6">
        <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Manage My Ads</h1>
              <p className="text-sm text-muted-foreground">Only your listings are shown here. Gold/Silver ads are pinned first.</p>
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

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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
            <div className="rounded-xl bg-muted/60 p-3 hidden md:block">
              <p className="text-xs text-muted-foreground">Boosted</p>
              <p className="text-2xl font-bold text-foreground">{boostedCount}</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your ads by title, county, town or description"
            className="h-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No ads to show</h3>
            <p className="text-muted-foreground text-sm mb-6">Post an ad or adjust your search</p>
            <Button onClick={() => navigate("/post-ad")} className="h-10">
              <Plus className="w-4 h-4 mr-1.5" /> Post your first ad
            </Button>
          </div>
        ) : (
          <>
            <div className="xl:hidden mb-4 grid grid-cols-2 gap-2 sticky top-16 z-20 bg-background py-2">
              <Button variant={mobileTab === "list" ? "default" : "outline"} onClick={() => setMobileTab("list")} className="h-10">
                My Ads
              </Button>
              <Button
                variant={mobileTab === "preview" ? "default" : "outline"}
                onClick={() => selectedAd && setMobileTab("preview")}
                className="h-10"
                disabled={!selectedAd}
              >
                Preview
              </Button>
            </div>

            {mobileTab === "list" && (
              <div className="xl:hidden space-y-3">
                {visibleAds.map((ad) => (
                  <MyAdCard
                    key={ad.id}
                    ad={ad}
                    selected={selectedAd?.id === ad.id}
                    onSelect={handleSelectAd}
                    onViewLive={handleViewLive}
                    onShare={handleShareCopy}
                    onEdit={setEditingAd}
                    onDelete={handleDelete}
                    onBoost={handleBoost}
                  />
                ))}

                {visibleCount < filteredAds.length && (
                  <Button variant="outline" className="w-full h-10" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                    Load more ads
                  </Button>
                )}
              </div>
            )}

            {mobileTab === "preview" && selectedAd && (
              <div className="xl:hidden space-y-3">
                <Button variant="outline" className="w-full h-10" onClick={() => setMobileTab("list")}>
                  Back to My Ads
                </Button>
                <MyAdPreview
                  ad={selectedAd}
                  onViewLive={handleViewLive}
                  onShareCopy={handleShareCopy}
                  onShareWhatsapp={handleShareWhatsApp}
                  onShareTwitter={handleShareTwitter}
                  onBoost={handleBoost}
                />
              </div>
            )}

            <div className="hidden xl:grid xl:grid-cols-5 gap-6">
              <div className="xl:col-span-2 space-y-3">
                {visibleAds.map((ad) => (
                  <MyAdCard
                    key={ad.id}
                    ad={ad}
                    selected={selectedAd?.id === ad.id}
                    onSelect={handleSelectAd}
                    onViewLive={handleViewLive}
                    onShare={handleShareCopy}
                    onEdit={setEditingAd}
                    onDelete={handleDelete}
                    onBoost={handleBoost}
                  />
                ))}

                {visibleCount < filteredAds.length && (
                  <Button variant="outline" className="w-full h-10" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                    Load more ads
                  </Button>
                )}
              </div>

              <div className="xl:col-span-3">
                {selectedAd ? (
                  <MyAdPreview
                    ad={selectedAd}
                    onViewLive={handleViewLive}
                    onShareCopy={handleShareCopy}
                    onShareWhatsapp={handleShareWhatsApp}
                    onShareTwitter={handleShareTwitter}
                    onBoost={handleBoost}
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <EditAdDialog
        open={Boolean(editingAd)}
        ad={editingAd}
        saving={saving}
        onOpenChange={(open) => !open && setEditingAd(null)}
        onSave={handleSaveEdit}
      />

      <Footer />
    </div>
  );
};

export default MyAdsPage;
