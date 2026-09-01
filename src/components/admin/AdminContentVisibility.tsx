import { useEffect, useState } from "react";
import { EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AI_VISIBILITY_KEYS, loadAiVisibility } from "@/lib/aiVisibility";

type Counts = { aiAds: number; aiDirectory: number };

const AdminContentVisibility = () => {
  const [hideDirectory, setHideDirectory] = useState(true);
  const [hideAds, setHideAds] = useState(true);
  const [counts, setCounts] = useState<Counts>({ aiAds: 0, aiDirectory: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: settings }, adRes, dirRes] = await Promise.all([
        (supabase.from("admin_settings" as any) as any)
          .select("key,value")
          .in("key", [AI_VISIBILITY_KEYS.directory, AI_VISIBILITY_KEYS.ads]),
        supabase.from("ads").select("id", { count: "exact", head: true }).eq("ai_generated", true),
        (supabase.from("directory_profiles" as any) as any)
          .select("id", { count: "exact", head: true })
          .eq("is_manual", false),
      ]);
      const map = new Map<string, string>(((settings as any[]) || []).map((r) => [r.key, r.value]));
      setHideDirectory((map.get(AI_VISIBILITY_KEYS.directory) ?? "true") !== "false");
      setHideAds((map.get(AI_VISIBILITY_KEYS.ads) ?? "true") !== "false");
      setCounts({ aiAds: adRes.count || 0, aiDirectory: (dirRes as any).count || 0 });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const rows = [
      { key: AI_VISIBILITY_KEYS.directory, value: String(hideDirectory), updated_at: new Date().toISOString() },
      { key: AI_VISIBILITY_KEYS.ads, value: String(hideAds), updated_at: new Date().toISOString() },
    ];
    const { error } = await (supabase.from("admin_settings" as any) as any).upsert(rows as any, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Could not save visibility settings");
      return;
    }
    await loadAiVisibility(true);
    toast.success("Content visibility updated");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading visibility settings…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <EyeOff className="h-4 w-4" /> Content Visibility
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Hidden items stay in the database and keep their own indexable pages for Google — they are only removed from
          browse, search and homepage listings. Turn a switch off to bring them back to the site instantly.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Hide auto-generated directory profiles
            </p>
            <p className="text-xs text-muted-foreground">
              Jobs, spas, salons, doctors, hotels, tours and every other directory entry that was not published by a real
              user. Currently {counts.aiDirectory.toLocaleString()} auto-generated profiles.
            </p>
          </div>
          <Switch checked={hideDirectory} onCheckedChange={setHideDirectory} />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Hide AI-generated ads</p>
            <p className="text-xs text-muted-foreground">
              Listings created by the AI generator. Currently {counts.aiAds.toLocaleString()} AI ads. Ads posted by real
              users are never affected.
            </p>
          </div>
          <Switch checked={hideAds} onCheckedChange={setHideAds} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Save visibility
        </Button>
        <span className="text-xs text-muted-foreground">Visitors see the change on their next page load.</span>
      </div>
    </div>
  );
};

export default AdminContentVisibility;
