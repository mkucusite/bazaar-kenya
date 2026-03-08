import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Globe, Search, FileText, Sparkles, Loader2, Save, Eye, ExternalLink,
  Share2, Image, Tag, ChevronDown, ChevronUp, Bot, RefreshCw, ShoppingBag
} from "lucide-react";

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
};

type BlogSeoRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  is_published: boolean | null;
};

const SITE_URL = "https://kenyaadverts.co.ke";

const AdminSEO = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<SeoRow[]>([]);
  const [ads, setAds] = useState<AdSeoRow[]>([]);
  const [blogs, setBlogs] = useState<BlogSeoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<SeoRow>>>({});
  const [subTab, setSubTab] = useState<"pages" | "products" | "blog">("pages");
  const [adSearch, setAdSearch] = useState("");
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [adEditTitle, setAdEditTitle] = useState("");
  const [adEditDesc, setAdEditDesc] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pagesRes, adsRes, blogsRes] = await Promise.all([
      supabase.from("seo_settings" as any).select("*").order("page_slug"),
      supabase.from("ads").select("id,title,description,county,price,images,status,created_at").eq("status", "active").order("created_at", { ascending: false }).limit(50),
      supabase.from("blog_posts").select("id,title,slug,excerpt,image,is_published").order("created_at", { ascending: false }).limit(50),
    ]);
    setPages(((pagesRes.data || []) as any) as SeoRow[]);
    setAds((adsRes.data || []) as AdSeoRow[]);
    setBlogs((blogsRes.data || []) as BlogSeoRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSavePage = async (row: SeoRow) => {
    const changes = editData[row.id];
    if (!changes) return;
    setSaving(true);
    const { error } = await supabase.from("seo_settings" as any).update({
      ...changes,
      updated_at: new Date().toISOString(),
      updated_by: user?.id,
    } as any).eq("id", row.id);
    setSaving(false);
    if (error) { toast({ title: "Failed to save", description: error.message, variant: "destructive" }); return; }
    toast({ title: "SEO settings saved" });
    setEditData(prev => { const next = { ...prev }; delete next[row.id]; return next; });
    await loadData();
  };

  const handleAIGenerate = async (row: SeoRow) => {
    setAiLoading(row.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Generate an optimized SEO meta title (max 60 chars) and meta description (max 155 chars) for the "${row.page_name}" page of KenyaAdvert (kenyaadverts.co.ke), a Kenyan classifieds platform. Also suggest 5-8 SEO keywords separated by commas. The page URL is ${SITE_URL}${row.page_slug}.

Return EXACTLY in this format:
TITLE: [your title here]
DESC: [your description here]
KEYWORDS: [keyword1, keyword2, ...]`
          }]
        }
      });

      if (error) throw error;

      // Parse streaming response
      const text = typeof data === "string" ? data : await new Response(data).text();
      let content = "";
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(line.slice(6));
            content += parsed.choices?.[0]?.delta?.content || "";
          } catch {}
        }
      }

      const titleMatch = content.match(/TITLE:\s*(.+)/i);
      const descMatch = content.match(/DESC:\s*(.+)/i);
      const kwMatch = content.match(/KEYWORDS:\s*(.+)/i);

      if (titleMatch || descMatch) {
        setEditData(prev => ({
          ...prev,
          [row.id]: {
            ...prev[row.id],
            ...(titleMatch ? { meta_title: titleMatch[1].trim() } : {}),
            ...(descMatch ? { meta_description: descMatch[1].trim() } : {}),
            ...(kwMatch ? { keywords: kwMatch[1].trim() } : {}),
          }
        }));
        toast({ title: "AI generated SEO suggestions" });
      }
    } catch (err: any) {
      toast({ title: "AI generation failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIGenerateAd = async (ad: AdSeoRow) => {
    setAiLoading(ad.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-ai-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Optimize this classified ad listing for SEO on KenyaAdvert.

Current title: ${ad.title}
Current description: ${ad.description || "None"}
Location: ${ad.county}
Price: ${ad.price ? `KSh ${ad.price.toLocaleString()}` : "Not set"}

Write an SEO-optimized title (max 70 chars, include location and key details) and description (max 200 chars, compelling, include call-to-action).

Return EXACTLY:
TITLE: [optimized title]
DESC: [optimized description]`
          }]
        }
      });

      if (error) throw error;
      const text = typeof data === "string" ? data : await new Response(data).text();
      let content = "";
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ") && line.slice(6).trim() !== "[DONE]") {
          try { content += JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ""; } catch {}
        }
      }

      const titleMatch = content.match(/TITLE:\s*(.+)/i);
      const descMatch = content.match(/DESC:\s*(.+)/i);
      if (titleMatch) setAdEditTitle(titleMatch[1].trim());
      if (descMatch) setAdEditDesc(descMatch[1].trim());
      setEditingAd(ad.id);
      toast({ title: "AI optimized ad SEO" });
    } catch (err: any) {
      toast({ title: "AI failed", description: err.message, variant: "destructive" });
    } finally { setAiLoading(null); }
  };

  const handleSaveAd = async (adId: string) => {
    setSaving(true);
    const { error } = await supabase.from("ads").update({
      title: adEditTitle,
      description: adEditDesc,
      updated_at: new Date().toISOString(),
    }).eq("id", adId);
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Ad updated" });
    setEditingAd(null);
    await loadData();
  };

  const getField = (row: SeoRow, field: keyof SeoRow) => {
    return (editData[row.id] as any)?.[field] ?? row[field] ?? "";
  };
  const setField = (rowId: string, field: string, value: string) => {
    setEditData(prev => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  };

  const getTitleScore = (title: string) => {
    if (!title) return { score: 0, label: "Missing", color: "text-destructive" };
    if (title.length > 60) return { score: 40, label: "Too long", color: "text-orange-500" };
    if (title.length < 30) return { score: 50, label: "Too short", color: "text-orange-500" };
    return { score: 90, label: "Good", color: "text-primary" };
  };

  const getDescScore = (desc: string) => {
    if (!desc) return { score: 0, label: "Missing", color: "text-destructive" };
    if (desc.length > 160) return { score: 40, label: "Too long", color: "text-orange-500" };
    if (desc.length < 80) return { score: 50, label: "Too short", color: "text-orange-500" };
    return { score: 90, label: "Good", color: "text-primary" };
  };

  const filteredAds = ads.filter(a =>
    !adSearch || a.title.toLowerCase().includes(adSearch.toLowerCase()) || a.county.toLowerCase().includes(adSearch.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1.5 border-b border-border/60 pb-2">
        {[
          { id: "pages" as const, label: "Pages SEO", icon: Globe },
          { id: "products" as const, label: "Products SEO", icon: ShoppingBag },
          { id: "blog" as const, label: "Blog SEO", icon: FileText },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors ${
              subTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* PAGES SEO */}
      {subTab === "pages" && (
        <div className="space-y-2">
          {pages.map(row => {
            const titleVal = getField(row, "meta_title") as string;
            const descVal = getField(row, "meta_description") as string;
            const titleScore = getTitleScore(titleVal);
            const descScore = getDescScore(descVal);
            const isExpanded = expandedPage === row.id;
            const hasChanges = !!editData[row.id];

            return (
              <div key={row.id} className="border border-border/60 rounded-xl overflow-hidden">
                <button onClick={() => setExpandedPage(isExpanded ? null : row.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{row.page_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{SITE_URL}{row.page_slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${titleScore.color} bg-muted`}>Title: {titleScore.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${descScore.color} bg-muted`}>Desc: {descScore.label}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                    {/* Google Preview */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5">Google Preview</p>
                      <p className="text-[#1a0dab] text-sm font-medium truncate">{titleVal || "No title set"}</p>
                      <p className="text-[#006621] text-xs truncate">{SITE_URL}{row.page_slug}</p>
                      <p className="text-xs text-[#545454] line-clamp-2">{descVal || "No description set"}</p>
                    </div>

                    {/* Social Preview */}
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1"><Share2 className="w-3 h-3" /> Social Share Preview</p>
                      <div className="border border-border/60 rounded-lg overflow-hidden max-w-sm">
                        <div className="bg-muted h-24 flex items-center justify-center">
                          {(getField(row, "og_image") as string) ? (
                            <img src={getField(row, "og_image") as string} className="w-full h-full object-cover" alt="" />
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

                    {/* Edit fields */}
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Meta Title <span className={titleScore.color}>({titleVal.length}/60)</span></label>
                        <Input value={titleVal} onChange={e => setField(row.id, "meta_title", e.target.value)} className="h-9 mt-1" placeholder="Page title for search engines" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Meta Description <span className={descScore.color}>({descVal.length}/160)</span></label>
                        <Textarea value={descVal} onChange={e => setField(row.id, "meta_description", e.target.value)} className="mt-1 min-h-[60px]" placeholder="Page description for search results" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Keywords</label>
                          <Input value={getField(row, "keywords") as string} onChange={e => setField(row.id, "keywords", e.target.value)} className="h-9 mt-1" placeholder="keyword1, keyword2" />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Canonical URL</label>
                          <Input value={getField(row, "canonical_url") as string} onChange={e => setField(row.id, "canonical_url", e.target.value)} className="h-9 mt-1" placeholder={`${SITE_URL}${row.page_slug}`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">OG Image URL</label>
                          <Input value={getField(row, "og_image") as string} onChange={e => setField(row.id, "og_image", e.target.value)} className="h-9 mt-1" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Robots</label>
                          <Input value={getField(row, "robots") as string} onChange={e => setField(row.id, "robots", e.target.value)} className="h-9 mt-1" placeholder="index, follow" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => handleAIGenerate(row)} disabled={aiLoading === row.id} className="text-xs h-8">
                        {aiLoading === row.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        AI Generate
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

      {/* PRODUCTS SEO */}
      {subTab === "products" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={adSearch} onChange={e => setAdSearch(e.target.value)} placeholder="Search ads..." className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" onClick={loadData}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>

          <p className="text-xs text-muted-foreground">{filteredAds.length} active listings</p>

          <div className="space-y-2">
            {filteredAds.map(ad => {
              const titleScore = getTitleScore(ad.title);
              const descScore = getDescScore(ad.description || "");
              const isEditing = editingAd === ad.id;

              return (
                <div key={ad.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{ad.title}</p>
                      <p className="text-[10px] text-muted-foreground">{ad.county} • KSh {(ad.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${titleScore.color} bg-muted`}>{titleScore.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${descScore.color} bg-muted`}>{descScore.label}</span>
                    </div>
                  </div>

                  {/* Google preview for this product */}
                  <div className="bg-muted/30 rounded-lg p-2 space-y-0.5">
                    <p className="text-[#1a0dab] text-xs font-medium truncate">{ad.title} | KenyaAdvert</p>
                    <p className="text-[#006621] text-[10px] truncate">{SITE_URL}/ads/{ad.id}</p>
                    <p className="text-[10px] text-[#545454] line-clamp-2">{ad.description || "No description"}</p>
                  </div>

                  {isEditing && (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Title ({adEditTitle.length}/70)</label>
                        <Input value={adEditTitle} onChange={e => setAdEditTitle(e.target.value)} className="h-9 mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Description ({adEditDesc.length}/200)</label>
                        <Textarea value={adEditDesc} onChange={e => setAdEditDesc(e.target.value)} className="mt-1 min-h-[60px]" />
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => handleSaveAd(ad.id)} disabled={saving} className="text-xs h-7"><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingAd(null)} className="text-xs h-7">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setEditingAd(ad.id); setAdEditTitle(ad.title); setAdEditDesc(ad.description || ""); }}>
                        Edit SEO
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleAIGenerateAd(ad)} disabled={aiLoading === ad.id}>
                        {aiLoading === ad.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        AI Optimize
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BLOG SEO */}
      {subTab === "blog" && (
        <div className="space-y-2">
          {blogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No blog posts yet.</p>
          ) : blogs.map(post => {
            const titleScore = getTitleScore(post.title);
            const descScore = getDescScore(post.excerpt || "");

            return (
              <div key={post.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{post.title}</p>
                    <p className="text-[10px] text-muted-foreground">/blog/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${post.is_published ? "text-primary bg-primary/10" : "text-muted-foreground bg-muted"}`}>
                      {post.is_published ? "Published" : "Draft"}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${titleScore.color} bg-muted`}>{titleScore.label}</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-2 space-y-0.5">
                  <p className="text-[#1a0dab] text-xs font-medium truncate">{post.title} | KenyaAdvert Blog</p>
                  <p className="text-[#006621] text-[10px] truncate">{SITE_URL}/blog/{post.slug}</p>
                  <p className="text-[10px] text-[#545454] line-clamp-2">{post.excerpt || "No excerpt set"}</p>
                </div>

                {/* Social share preview */}
                <div className="border border-border/60 rounded-lg overflow-hidden max-w-xs">
                  <div className="bg-muted h-16 flex items-center justify-center">
                    {post.image ? <img src={post.image} className="w-full h-full object-cover" alt="" /> : <Image className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="p-1.5">
                    <p className="text-[9px] text-muted-foreground">kenyaadverts.co.ke</p>
                    <p className="text-[10px] font-medium text-foreground truncate">{post.title}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSEO;
