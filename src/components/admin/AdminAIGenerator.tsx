import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateListings } from "@/services/aiListingService";
import { clearSettingsCache } from "@/services/uploadService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Zap, Trash2, Info, Clock, Play } from "lucide-react";

const AdminAIGenerator = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState("Electronics");
  const [batchSize, setBatchSize] = useState("5");
  const [categoryOverride, setCategoryOverride] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [aiListings, setAiListings] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, activeToday: 0, lastGenerated: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-generation settings
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [autoListingsCount, setAutoListingsCount] = useState("20");
  const [autoBlogsCount, setAutoBlogsCount] = useState("10");
  const [triggeringAuto, setTriggeringAuto] = useState(false);

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
    if (data) {
      const map: Record<string, string> = Object.fromEntries((data as any[]).map((r: any) => [r.key, r.value]));
      setAiEnabled(map.ai_listings_enabled !== "false");
      setDefaultCategory(map.ai_default_category || "Electronics");
      setBatchSize(map.ai_listings_per_batch || "5");
      setAutoEnabled(map.ai_auto_enabled !== "false");
      setAutoListingsCount(map.ai_auto_listings_count || "20");
      setAutoBlogsCount(map.ai_auto_blogs_count || "10");
    }
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
      ai_listings_enabled: aiEnabled ? "true" : "false",
      ai_default_category: defaultCategory,
      ai_listings_per_batch: batchSize,
      ai_auto_enabled: autoEnabled ? "true" : "false",
      ai_auto_listings_count: autoListingsCount,
      ai_auto_blogs_count: autoBlogsCount,
    };
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from("admin_settings" as any).upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
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
        toast({ title: `✅ Generated ${result.success} listings${result.errors > 0 ? `, ${result.errors} failed` : ""}` });
      } else {
        toast({ title: "No listings generated", variant: "destructive" });
      }
      await loadAiListings();
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleTriggerAuto = async (mode: "all" | "listings" | "blogs") => {
    setTriggeringAuto(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-generate", {
        body: {
          mode,
          listing_count: parseInt(autoListingsCount),
          blog_count: parseInt(autoBlogsCount),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Auto-generation complete!",
        description: data?.message || "Check listings and blog pages.",
      });
      await loadAiListings();
    } catch (err: any) {
      toast({ title: "Auto-generation failed", description: err.message, variant: "destructive" });
    }
    setTriggeringAuto(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this AI-generated listing?")) return;
    setDeletingId(id);
    await supabase.from("ads").delete().eq("id", id);
    setAiListings((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
    toast({ title: "Listing deleted" });
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Auto-Generation Controls */}
      <div className="bg-card border-2 border-primary/20 rounded-xl p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Daily Auto-Generation (Cron Job)
        </h3>
        <p className="text-xs text-muted-foreground">
          Automatically generates listings and blog posts every day. You can also trigger it manually.
        </p>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Enable Auto-Generation</label>
          <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Listings Per Day</label>
            <Input type="number" min={1} max={50} value={autoListingsCount} onChange={(e) => setAutoListingsCount(e.target.value)} className="h-9" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Blogs Per Day</label>
            <Input type="number" min={1} max={20} value={autoBlogsCount} onChange={(e) => setAutoBlogsCount(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleTriggerAuto("all")}
            disabled={triggeringAuto}
            className="h-9"
          >
            {triggeringAuto ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            Run Now (Listings + Blogs)
          </Button>
          <Button
            variant="outline"
            onClick={() => handleTriggerAuto("listings")}
            disabled={triggeringAuto}
            className="h-9"
          >
            Generate Listings Only
          </Button>
          <Button
            variant="outline"
            onClick={() => handleTriggerAuto("blogs")}
            disabled={triggeringAuto}
            className="h-9"
          >
            Generate Blogs Only
          </Button>
        </div>
      </div>

      {/* Manual Generation */}
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
        <h3 className="font-heading font-semibold text-sm text-foreground">Manual Generation</h3>

        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Enable AI Generator</label>
          <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Default Category</label>
          <select
            value={defaultCategory}
            onChange={(e) => setDefaultCategory(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            {!categories.includes(defaultCategory) && <option value={defaultCategory}>{defaultCategory}</option>}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1">Listings Per Batch</label>
          <Input type="number" min={1} max={20} value={batchSize} onChange={(e) => setBatchSize(e.target.value)} className="h-9 w-24" />
        </div>

        <Button onClick={saveSettings} disabled={saving} className="h-9">
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
          Save All Settings
        </Button>
      </div>

      {/* Generate */}
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
        <h3 className="font-heading font-semibold text-sm text-foreground">Generate Listings (Manual)</h3>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Category (optional override)</label>
          <select
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Use default ({defaultCategory})</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || !aiEnabled}
          className="h-10 w-full"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating with AI + images...</>
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Generate Listings</>
          )}
        </Button>
      </div>

      {/* Stats */}
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

      {/* Recent AI Listings */}
      <div className="bg-card border border-border/60 rounded-xl p-4">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">Recent AI Listings</h3>
        {aiListings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No AI-generated listings yet.</p>
        ) : (
          <div className="space-y-2">
            {aiListings.map((ad) => (
              <div key={ad.id} className="flex items-center gap-3 border border-border/40 rounded-lg p-2">
                <img
                  src={ad.images?.[0] || "/placeholder.svg"}
                  alt=""
                  className="w-10 h-10 rounded object-cover bg-muted shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    KSh {Number(ad.price).toLocaleString()} · {ad.county} · {ad.status}
                  </p>
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
    </div>
  );
};

export default AdminAIGenerator;
