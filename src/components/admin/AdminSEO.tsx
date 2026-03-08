import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Globe,
  Search,
  FileText,
  Sparkles,
  Loader2,
  Save,
  ExternalLink,
  Share2,
  Image,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingBag,
  WandSparkles,
} from "lucide-react";
import { getAdPath } from "@/lib/ad-links";

type SeoRow = {
  id: string;
  page_slug: string;
  page_name: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  keywords: string | null;
  robots: string | null;
  json_ld: any;
  updated_at: string;
};

type AdSeoRow = {
  id: string;
  title: string;
  description: string | null;
  county: string;
  price: number | null;
  images: string[] | null;
  status: string | null;
  created_at: string | null;
  slug: string | null;
};

type BlogSeoRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  is_published: boolean | null;
};

type ProductSeo = {
  meta_title: string;
  meta_description: string;
  keywords: string;
  canonical_url: string;
  og_image: string;
  robots: string;
};

const SITE_URL = "https://kenyaadverts.co.ke";

const getDefaultProductSeo = (ad: AdSeoRow): ProductSeo => ({
  meta_title: ad.title,
  meta_description: ad.description || "",
  keywords: "",
  canonical_url: `${SITE_URL}${getAdPath({ id: ad.id, title: ad.title, slug: ad.slug })}`,
  og_image: ad.images?.[0] || `${SITE_URL}/og-image.png`,
  robots: "index, follow",
});

const getAdIdFromPageSlug = (pageSlug: string) => {
  const match = pageSlug.match(/^\/ads\/([0-9a-f-]+)/i);
  return match?.[1] ?? null;
};

const clamp = (value: string, max: number) => value.trim().slice(0, max);

const AdminSEO = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<SeoRow[]>([]);
  const [ads, setAds] = useState<AdSeoRow[]>([]);
  const [blogs, setBlogs] = useState<BlogSeoRow[]>([]);
  const [adSeoMap, setAdSeoMap] = useState<Record<string, Partial<SeoRow>>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<SeoRow>>>({});

  const [subTab, setSubTab] = useState<"pages" | "products" | "blog">("pages");
  const [adSearch, setAdSearch] = useState("");
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [adEditSeo, setAdEditSeo] = useState<ProductSeo | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    const [pagesRes, adsRes, blogsRes, adSeoRes] = await Promise.all([
      supabase.from("seo_settings" as any).select("*").not("page_slug", "like", "/ads/%").order("page_slug"),
      supabase
        .from("ads")
        .select("id,title,description,county,price,images,status,created_at,slug")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("blog_posts")
        .select("id,title,slug,excerpt,image,is_published")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("seo_settings" as any)
        .select("*")
        .like("page_slug", "/ads/%")
        .limit(500),
    ]);

    setPages(((pagesRes.data || []) as any) as SeoRow[]);
    setAds((adsRes.data || []) as AdSeoRow[]);
    setBlogs((blogsRes.data || []) as BlogSeoRow[]);

    const nextMap: Record<string, Partial<SeoRow>> = {};
    const adSeoRows = ((adSeoRes.data || []) as unknown as SeoRow[]) || [];
    for (const row of adSeoRows) {
      const adId = getAdIdFromPageSlug(row.page_slug);
      if (adId) nextMap[adId] = row;
    }
    setAdSeoMap(nextMap);

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getField = (row: SeoRow, field: keyof SeoRow) => {
    return (editData[row.id] as any)?.[field] ?? row[field] ?? "";
  };

  const setField = (rowId: string, field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  };

  const handleSavePage = async (row: SeoRow) => {
    const changes = editData[row.id];
    if (!changes) return;

    setSaving(true);
    const { error } = await supabase
      .from("seo_settings" as any)
      .update({
        ...changes,
        canonical_url:
          (changes.canonical_url as string | undefined)?.trim() ||
          `${SITE_URL}${row.page_slug}`,
        og_image:
          (changes.og_image as string | undefined)?.trim() || `${SITE_URL}/og-image.png`,
        robots: (changes.robots as string | undefined)?.trim() || "index, follow",
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      } as any)
      .eq("id", row.id);
    setSaving(false);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "SEO settings saved" });
    setEditData((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    await loadData();
  };

  const handleAIGeneratePage = async (row: SeoRow) => {
    setAiLoading(row.id);

    try {
      const { data, error } = await supabase.functions.invoke("seo-gemini", {
        body: {
          mode: "page",
          site_url: SITE_URL,
          page_name: row.page_name,
          page_slug: row.page_slug,
          meta_title: getField(row, "meta_title"),
          meta_description: getField(row, "meta_description"),
          keywords: getField(row, "keywords"),
          canonical_url: getField(row, "canonical_url"),
          og_image: getField(row, "og_image"),
          robots: getField(row, "robots"),
        },
      });

      if (error) throw error;

      setEditData((prev) => ({
        ...prev,
        [row.id]: {
          ...prev[row.id],
          meta_title: clamp(data?.meta_title || "", 60),
          meta_description: clamp(data?.meta_description || "", 155),
          keywords: data?.keywords || "",
          canonical_url: data?.canonical_url || `${SITE_URL}${row.page_slug}`,
          og_image: data?.og_image || `${SITE_URL}/og-image.png`,
          robots: data?.robots || "index, follow",
        },
      }));

      toast({ title: "Gemini generated SEO fields" });
    } catch (err: any) {
      toast({ title: "AI generation failed", description: err?.message || "Request failed", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const openAdEditor = (ad: AdSeoRow) => {
    const existing = adSeoMap[ad.id];
    setEditingAd(ad.id);
    setAdEditSeo({
      meta_title: existing?.meta_title || ad.title,
      meta_description: existing?.meta_description || ad.description || "",
      keywords: existing?.keywords || "",
      canonical_url: existing?.canonical_url || `${SITE_URL}${getAdPath({ id: ad.id, title: ad.title, slug: ad.slug })}`,
      og_image: existing?.og_image || ad.images?.[0] || `${SITE_URL}/og-image.png`,
      robots: existing?.robots || "index, follow",
    });
  };

  const handleAIGenerateAd = async (ad: AdSeoRow) => {
    setAiLoading(ad.id);

    try {
      const { data, error } = await supabase.functions.invoke("seo-gemini", {
        body: {
          mode: "product",
          site_url: SITE_URL,
          ad_id: ad.id,
          title: ad.title,
          description: ad.description || "",
          county: ad.county,
          price: ad.price,
          image_url: ad.images?.[0] || `${SITE_URL}/og-image.png`,
        },
      });

      if (error) throw error;

      setEditingAd(ad.id);
      setAdEditSeo({
        meta_title: clamp(data?.meta_title || ad.title, 70),
        meta_description: clamp(data?.meta_description || ad.description || "", 200),
        keywords: data?.keywords || "",
        canonical_url: data?.canonical_url || `${SITE_URL}${getAdPath({ id: ad.id, title: data?.meta_title || ad.title, slug: ad.slug })}`,
        og_image: data?.og_image || ad.images?.[0] || `${SITE_URL}/og-image.png`,
        robots: data?.robots || "index, follow",
      });

      toast({ title: "Gemini optimized product SEO" });
    } catch (err: any) {
      toast({ title: "AI failed", description: err?.message || "Request failed", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSaveAd = async (ad: AdSeoRow) => {
    if (!adEditSeo || !user) return;

    const payload = {
      meta_title: clamp(adEditSeo.meta_title, 70),
      meta_description: clamp(adEditSeo.meta_description, 200),
      keywords: adEditSeo.keywords.trim(),
      canonical_url:
        adEditSeo.canonical_url.trim() || `${SITE_URL}${getAdPath({ id: ad.id, title: adEditSeo.meta_title, slug: ad.slug })}`,
      og_image: adEditSeo.og_image.trim() || ad.images?.[0] || `${SITE_URL}/og-image.png`,
      robots: adEditSeo.robots.trim() || "index, follow",
    };

    setSaving(true);

    const [adUpdate, seoUpdate] = await Promise.all([
      supabase
        .from("ads")
        .update({
          title: payload.meta_title,
          description: payload.meta_description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ad.id),
      supabase.from("seo_settings" as any).upsert(
        {
          page_slug: `/ads/${ad.id}`,
          page_name: `Product: ${payload.meta_title}`,
          meta_title: payload.meta_title,
          meta_description: payload.meta_description,
          keywords: payload.keywords,
          canonical_url: payload.canonical_url,
          og_image: payload.og_image,
          robots: payload.robots,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "page_slug" },
      ),
    ]);

    setSaving(false);

    if (adUpdate.error || seoUpdate.error) {
      toast({
        title: "Failed to save product SEO",
        description: adUpdate.error?.message || seoUpdate.error?.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Product SEO updated" });
    setEditingAd(null);
    setAdEditSeo(null);
    await loadData();
  };

  const handleAutoOptimizeProducts = async () => {
    if (!user) return;

    const targets = filteredAds.slice(0, 20);
    if (targets.length === 0) {
      toast({ title: "No products found" });
      return;
    }

    setBulkOptimizing(true);
    let successCount = 0;

    for (const ad of targets) {
      try {
        const { data, error } = await supabase.functions.invoke("seo-gemini", {
          body: {
            mode: "product",
            site_url: SITE_URL,
            ad_id: ad.id,
            title: ad.title,
            description: ad.description || "",
            county: ad.county,
            price: ad.price,
            image_url: ad.images?.[0] || `${SITE_URL}/og-image.png`,
          },
        });

        if (error) throw error;

        const metaTitle = clamp(data?.meta_title || ad.title, 70);
        const metaDescription = clamp(data?.meta_description || ad.description || "", 200);
        const canonical = data?.canonical_url || `${SITE_URL}${getAdPath({ id: ad.id, title: metaTitle, slug: ad.slug })}`;
        const ogImage = data?.og_image || ad.images?.[0] || `${SITE_URL}/og-image.png`;

        const [adUpdate, seoUpdate] = await Promise.all([
          supabase
            .from("ads")
            .update({ title: metaTitle, description: metaDescription, updated_at: new Date().toISOString() })
            .eq("id", ad.id),
          supabase.from("seo_settings" as any).upsert(
            {
              page_slug: `/ads/${ad.id}`,
              page_name: `Product: ${metaTitle}`,
              meta_title: metaTitle,
              meta_description: metaDescription,
              keywords: data?.keywords || "",
              canonical_url: canonical,
              og_image: ogImage,
              robots: data?.robots || "index, follow",
              updated_by: user.id,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "page_slug" },
          ),
        ]);

        if (adUpdate.error || seoUpdate.error) {
          throw new Error(adUpdate.error?.message || seoUpdate.error?.message || "Save failed");
        }

        successCount += 1;
      } catch (err) {
        console.error("Auto optimize failed for ad", ad.id, err);
      }
    }

    setBulkOptimizing(false);
    await loadData();

    toast({
      title: "Auto-optimization complete",
      description: `${successCount}/${targets.length} products optimized with Gemini`,
    });
  };

  const getTitleScore = (title: string) => {
    if (!title) return { label: "Missing", tone: "text-destructive" };
    if (title.length > 60) return { label: "Too long", tone: "text-warning" };
    if (title.length < 30) return { label: "Too short", tone: "text-warning" };
    return { label: "Good", tone: "text-primary" };
  };

  const getDescScore = (desc: string) => {
    if (!desc) return { label: "Missing", tone: "text-destructive" };
    if (desc.length > 160) return { label: "Too long", tone: "text-warning" };
    if (desc.length < 80) return { label: "Too short", tone: "text-warning" };
    return { label: "Good", tone: "text-primary" };
  };

  const filteredAds = useMemo(
    () =>
      ads.filter(
        (ad) =>
          !adSearch ||
          ad.title.toLowerCase().includes(adSearch.toLowerCase()) ||
          ad.county.toLowerCase().includes(adSearch.toLowerCase()),
      ),
    [ads, adSearch],
  );

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 border-b border-border/60 pb-2">
        {[
          { id: "pages" as const, label: "Pages SEO", icon: Globe },
          { id: "products" as const, label: "Products SEO", icon: ShoppingBag },
          { id: "blog" as const, label: "Blog SEO", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors ${
              subTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {subTab === "pages" && (
        <div className="space-y-2">
          {pages.map((row) => {
            const titleVal = String(getField(row, "meta_title") || "");
            const descVal = String(getField(row, "meta_description") || "");
            const titleScore = getTitleScore(titleVal);
            const descScore = getDescScore(descVal);
            const isExpanded = expandedPage === row.id;
            const hasChanges = !!editData[row.id];

            return (
              <div key={row.id} className="border border-border/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPage(isExpanded ? null : row.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{row.page_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{SITE_URL}{row.page_slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${titleScore.tone} bg-muted`}>
                      Title: {titleScore.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${descScore.tone} bg-muted`}>
                      Desc: {descScore.label}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">Google Preview</p>
                      <p className="text-sm font-medium text-foreground truncate">{titleVal || "No title set"}</p>
                      <p className="text-xs text-muted-foreground truncate">{SITE_URL}{row.page_slug}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{descVal || "No description set"}</p>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
                        <Share2 className="w-3 h-3" /> Social Share Preview
                      </p>
                      <div className="border border-border/60 rounded-lg overflow-hidden max-w-sm">
                        <div className="bg-muted h-24 flex items-center justify-center">
                          {(getField(row, "og_image") as string) ? (
                            <img src={getField(row, "og_image") as string} className="w-full h-full object-cover" alt="SEO social preview" />
                          ) : (
                            <Image className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">kenyaadverts.co.ke</p>
                          <p className="text-xs font-medium text-foreground truncate">{titleVal || "No title"}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{descVal || "No description"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Meta Title <span className={titleScore.tone}>({titleVal.length}/60)</span>
                        </label>
                        <Input value={titleVal} onChange={(e) => setField(row.id, "meta_title", e.target.value)} className="h-9 mt-1" />
                      </div>

                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          Meta Description <span className={descScore.tone}>({descVal.length}/160)</span>
                        </label>
                        <Textarea value={descVal} onChange={(e) => setField(row.id, "meta_description", e.target.value)} className="mt-1 min-h-[60px]" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keywords</label>
                          <Input value={String(getField(row, "keywords") || "")} onChange={(e) => setField(row.id, "keywords", e.target.value)} className="h-9 mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Canonical URL</label>
                          <Input value={String(getField(row, "canonical_url") || "")} onChange={(e) => setField(row.id, "canonical_url", e.target.value)} className="h-9 mt-1" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">OG Image URL</label>
                          <Input value={String(getField(row, "og_image") || "")} onChange={(e) => setField(row.id, "og_image", e.target.value)} className="h-9 mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Robots</label>
                          <Input value={String(getField(row, "robots") || "")} onChange={(e) => setField(row.id, "robots", e.target.value)} className="h-9 mt-1" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => handleAIGeneratePage(row)} disabled={aiLoading === row.id} className="text-xs h-8">
                        {aiLoading === row.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Gemini Generate
                      </Button>
                      {hasChanges && (
                        <Button size="sm" onClick={() => handleSavePage(row)} disabled={saving} className="text-xs h-8">
                          <Save className="w-3 h-3 mr-1" /> Save Changes
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-xs h-8 ml-auto" asChild>
                        <a href={`${SITE_URL}${row.page_slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" /> View Page
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subTab === "products" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={adSearch} onChange={(e) => setAdSearch(e.target.value)} placeholder="Search products by title or county..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" onClick={handleAutoOptimizeProducts} disabled={bulkOptimizing || filteredAds.length === 0}>
              {bulkOptimizing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <WandSparkles className="w-3.5 h-3.5 mr-1" />}
              Auto Optimize (Top 20)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{filteredAds.length} active listings</p>

          <div className="space-y-2">
            {filteredAds.map((ad) => {
              const titleScore = getTitleScore(ad.title);
              const descScore = getDescScore(ad.description || "");
              const isEditing = editingAd === ad.id;
              const activeSeo = isEditing && adEditSeo ? adEditSeo : { ...getDefaultProductSeo(ad), ...(adSeoMap[ad.id] || {}) };

              return (
                <div key={ad.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{ad.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ad.county} • KSh {(ad.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${titleScore.tone} bg-muted`}>{titleScore.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${descScore.tone} bg-muted`}>{descScore.label}</span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-2 space-y-0.5">
                    <p className="text-xs font-medium text-foreground truncate">{activeSeo.meta_title || "No title"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{activeSeo.canonical_url}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{activeSeo.meta_description || "No description"}</p>
                  </div>

                  <div className="border border-border/60 rounded-lg overflow-hidden max-w-xs">
                    <div className="bg-muted h-16 flex items-center justify-center">
                      {activeSeo.og_image ? (
                        <img src={activeSeo.og_image} className="w-full h-full object-cover" alt="Product social preview" />
                      ) : (
                        <Image className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[9px] text-muted-foreground">kenyaadverts.co.ke</p>
                      <p className="text-[10px] font-medium text-foreground truncate">{activeSeo.meta_title || "No title"}</p>
                    </div>
                  </div>

                  {isEditing && adEditSeo && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">
                          Meta Title ({adEditSeo.meta_title.length}/70)
                        </label>
                        <Input
                          value={adEditSeo.meta_title}
                          onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, meta_title: e.target.value } : prev))}
                          className="h-9 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">
                          Meta Description ({adEditSeo.meta_description.length}/200)
                        </label>
                        <Textarea
                          value={adEditSeo.meta_description}
                          onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, meta_description: e.target.value } : prev))}
                          className="mt-1 min-h-[60px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Keywords</label>
                          <Input
                            value={adEditSeo.keywords}
                            onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, keywords: e.target.value } : prev))}
                            className="h-9 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Canonical URL</label>
                          <Input
                            value={adEditSeo.canonical_url}
                            onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, canonical_url: e.target.value } : prev))}
                            className="h-9 mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">OG Image URL</label>
                          <Input
                            value={adEditSeo.og_image}
                            onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, og_image: e.target.value } : prev))}
                            className="h-9 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Robots</label>
                          <Input
                            value={adEditSeo.robots}
                            onChange={(e) => setAdEditSeo((prev) => (prev ? { ...prev, robots: e.target.value } : prev))}
                            className="h-9 mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => handleSaveAd(ad)} disabled={saving} className="text-xs h-7">
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingAd(null); setAdEditSeo(null); }} className="text-xs h-7">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => openAdEditor(ad)}>
                        Edit SEO
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleAIGenerateAd(ad)}
                        disabled={aiLoading === ad.id}
                      >
                        {aiLoading === ad.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Gemini Optimize
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === "blog" && (
        <div className="space-y-2">
          {blogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No blog posts yet.</p>
          ) : (
            blogs.map((post) => {
              const titleScore = getTitleScore(post.title);

              return (
                <div key={post.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{post.title}</p>
                      <p className="text-[10px] text-muted-foreground">/blog/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          post.is_published ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"
                        }`}
                      >
                        {post.is_published ? "Published" : "Draft"}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${titleScore.tone} bg-muted`}>
                        {titleScore.label}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-2 space-y-0.5">
                    <p className="text-xs font-medium text-foreground truncate">{post.title} | KenyaAdvert Blog</p>
                    <p className="text-[10px] text-muted-foreground truncate">{SITE_URL}/blog/{post.slug}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{post.excerpt || "No excerpt set"}</p>
                  </div>

                  <div className="border border-border/60 rounded-lg overflow-hidden max-w-xs">
                    <div className="bg-muted h-16 flex items-center justify-center">
                      {post.image ? (
                        <img src={post.image} className="w-full h-full object-cover" alt="Blog social preview" />
                      ) : (
                        <Image className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[9px] text-muted-foreground">kenyaadverts.co.ke</p>
                      <p className="text-[10px] font-medium text-foreground truncate">{post.title}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSEO;
