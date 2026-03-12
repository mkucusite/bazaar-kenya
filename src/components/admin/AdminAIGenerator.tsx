import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateListings } from "@/services/aiListingService";
import { clearSettingsCache } from "@/services/uploadService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Zap, Trash2, Eye, EyeOff, Info, CalendarClock, PlayCircle } from "lucide-react";

const AdminAIGenerator = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [runningDaily, setRunningDaily] = useState(false);

  const [geminiKey, setGeminiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState("Electronics");
  const [batchSize, setBatchSize] = useState("5");

  const [dailyEnabled, setDailyEnabled] = useState(true);
  const [dailyListingsCount, setDailyListingsCount] = useState("20");
  const [dailyBlogsCount, setDailyBlogsCount] = useState("10");
  const [defaultPhone, setDefaultPhone] = useState("0115475543");
  const [defaultWhatsapp, setDefaultWhatsapp] = useState("0115475543");

  const [categoryOverride, setCategoryOverride] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [aiListings, setAiListings] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, activeToday: 0, lastGenerated: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadSettings(), loadCategories(), loadAiListings()]);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from("admin_settings" as any).select("key, value");
    if (!data) return;

    const map: Record<string, string> = Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value]));

    setGeminiKey(map.gemini_api_key || "");
    setAiEnabled(map.ai_listings_enabled !== "false");
    setDefaultCategory(map.ai_default_category || "Electronics");
    setBatchSize(map.ai_listings_per_batch || "5");

    setDailyEnabled(map.ai_daily_enabled !== "false");
    setDailyListingsCount(map.ai_daily_listings_count || "20");
    setDailyBlogsCount(map.ai_daily_blogs_count || "10");
    setDefaultPhone(map.ai_default_phone || "0115475543");
    setDefaultWhatsapp(map.ai_default_whatsapp || "0115475543");
  };

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("name").order("sort_order");
    setCategories((data || []).map((c: any) => c.name));
  };

  const loadAiListings = async () => {
    const { data, count } = await supabase
      .from("ads")
      .select("id, title, images, county, price, status, created_at, badge", { count: "exact" })
      .eq("ai_generated", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const listings = (data || []) as any[];
    setAiListings(listings);

    const today = new Date().toISOString().split("T")[0];
    setStats({
      total: count || listings.length,
      activeToday: listings.filter((l: any) => l.created_at?.startsWith(today) && l.status === "active").length,
      lastGenerated: listings[0]?.created_at || "",
    });
  };

  const saveSettings = async () => {
    setSaving(true);

    const settings: Record<string, string> = {
      gemini_api_key: geminiKey,
      ai_listings_enabled: aiEnabled ? "true" : "false",
      ai_default_category: defaultCategory,
      ai_listings_per_batch: String(Math.min(Math.max(Number(batchSize) || 5, 1), 20)),
      ai_daily_enabled: dailyEnabled ? "true" : "false",
      ai_daily_listings_count: String(Math.min(Math.max(Number(dailyListingsCount) || 20, 1), 100)),
      ai_daily_blogs_count: String(Math.min(Math.max(Number(dailyBlogsCount) || 10, 0), 50)),
      ai_default_phone: defaultPhone.trim() || "0115475543",
      ai_default_whatsapp: defaultWhatsapp.trim() || "0115475543",
    };

    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from("admin_settings" as any)
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    }

    clearSettingsCache();
    setSaving(false);
    toast({ title: "AI settings saved!" });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateListings(categoryOverride || undefined);
      if (result.success > 0) {
        toast({ title: `Generated ${result.success} listings${result.errors > 0 ? `, ${result.errors} failed` : ""}` });
      } else {
        toast({ title: "No listings generated", variant: "destructive" });
      }
      await loadAiListings();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleRunDailyNow = async () => {
    setRunningDaily(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-publish-content", {
        body: {
          source: "manual",
          mode: "both",
          listingsCount: Math.min(Math.max(Number(dailyListingsCount) || 20, 1), 100),
          blogsCount: Math.min(Math.max(Number(dailyBlogsCount) || 10, 0), 50),
        },
      });

      if (error) throw new Error(error.message || "Daily run failed");
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Daily automation run completed",
        description: `Listings: ${data?.listings?.success || 0} success, Blogs: ${data?.blogs?.success || 0} success`,
      });

      await loadAiListings();
    } catch (err: any) {
      toast({ title: "Daily run failed", description: err.message, variant: "destructive" });
    } finally {
      setRunningDaily(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this AI-generated listing?")) return;
    setDeletingId(id);
    await supabase.from("ads").delete().eq("id", id);
    setAiListings((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
    toast({ title: "Listing deleted" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-foreground">AI Configuration</h3>

        {!geminiKey && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              No Gemini API key set — using built-in templates as fallback. Add a free Gemini key at{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="underline">
                aistudio.google.com
              </a>
              .
            </p>
          </div>
        )}

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Gemini API Key</label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter Gemini API key"
              className="h-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Default Category</label>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {!categories.includes(defaultCategory) && <option value={defaultCategory}>{defaultCategory}</option>}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Listings Per Batch</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Default Phone</label>
            <Input value={defaultPhone} onChange={(e) => setDefaultPhone(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Default WhatsApp</label>
            <Input value={defaultWhatsapp} onChange={(e) => setDefaultWhatsapp(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="flex items-center justify-between border border-border/60 rounded-lg p-3">
          <label className="text-xs font-medium text-foreground">Enable AI Generator</label>
          <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
        </div>

        <div className="flex items-center justify-between border border-border/60 rounded-lg p-3">
          <label className="text-xs font-medium text-foreground">Enable Daily Auto Publish</label>
          <Switch checked={dailyEnabled} onCheckedChange={setDailyEnabled} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Daily Listings Count</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={dailyListingsCount}
              onChange={(e) => setDailyListingsCount(e.target.value)}
              className="h-9"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Daily Blog Count</label>
            <Input
              type="number"
              min={0}
              max={50}
              value={dailyBlogsCount}
              onChange={(e) => setDailyBlogsCount(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={saveSettings} disabled={saving} className="h-9">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Save Settings
          </Button>

          <Button variant="outline" onClick={handleRunDailyNow} disabled={runningDaily} className="h-9">
            {runningDaily ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
            Run Daily Now
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-sm text-foreground">Generate Listings</h3>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Generate for specific category (optional)</label>
          <select
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Use default ({defaultCategory})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating || !aiEnabled}
          title={!aiEnabled ? "Enable AI generation in settings above" : undefined}
          className="h-10 w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {geminiKey ? "Generating with Gemini..." : "Generating with templates..."}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" /> Generate Listings
            </>
          )}
        </Button>

        {!aiEnabled && <p className="text-[10px] text-muted-foreground">Enable AI generation in settings above</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">Total AI Listings</p>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-primary">{stats.activeToday}</p>
          <p className="text-[10px] text-muted-foreground">Active Today</p>
        </div>
        <div className="bg-card border border-border/60 rounded-lg p-3 text-center">
          <p className="text-xs font-medium text-foreground">{stats.lastGenerated ? new Date(stats.lastGenerated).toLocaleDateString() : "—"}</p>
          <p className="text-[10px] text-muted-foreground">Last Generated</p>
        </div>
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Recent AI Listings</h3>
        {aiListings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No AI-generated listings yet. Click Generate to create your first batch.</p>
        ) : (
          <div className="space-y-2">
            {aiListings.map((ad) => (
              <div key={ad.id} className="flex items-center gap-3 border border-border/40 rounded-lg p-2">
                <img src={ad.images?.[0] || "/placeholder.svg"} alt="" className="w-10 h-10 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                  <p className="text-[10px] text-muted-foreground">KSh {Number(ad.price).toLocaleString()} · {ad.county} · {ad.status}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(ad.created_at).toLocaleDateString()}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive shrink-0"
                  disabled={deletingId === ad.id}
                  onClick={() => handleDelete(ad.id)}
                >
                  {deletingId === ad.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          <span>Daily auto publish runs from backend scheduler using your saved counts.</span>
        </div>
      </div>
    </div>
  );
};

export default AdminAIGenerator;

