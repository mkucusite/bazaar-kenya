import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type ConfigRow = { id: string; key: string; value: string };

const AD_PRICE_KEYS = [
  { key: "silver_price", label: "Silver Package" },
  { key: "gold_price", label: "Gold Package" },
];

const CAMPAIGN_PRICE_KEYS = [
  { key: "campaign_basic_banner_price", label: "Basic Banner" },
  { key: "campaign_featured_business_price", label: "Featured Business" },
  { key: "campaign_category_sponsor_price", label: "Category Sponsor" },
];

const AdminPricing = () => {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const { data, error } = await supabase
      .from("site_config" as any)
      .select("id, key, value");
    if (error) {
      toast({ title: "Could not load pricing", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setConfigs(data as unknown as ConfigRow[]);
      const map: Record<string, string> = {};
      for (const row of data as unknown as ConfigRow[]) map[row.key] = row.value;
      setValues(map);
    }
  };

  useEffect(() => {
    (async () => {
      await reload();
      setLoading(false);
    })();
  }, []);

  const upsert = async (key: string, newVal: string): Promise<string | null> => {
    const existing = configs.find((c) => c.key === key);
    if (existing) {
      if (newVal === existing.value) return null;
      const { error } = await (supabase.from("site_config" as any) as any)
        .update({ value: newVal, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      return error?.message || null;
    } else {
      const { error } = await (supabase.from("site_config" as any) as any)
        .insert({ key, value: newVal });
      return error?.message || null;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const errors: string[] = [];
    try {
      for (const { key } of AD_PRICE_KEYS) {
        const e = await upsert(key, values[key] || "0");
        if (e) errors.push(`${key}: ${e}`);
      }
      // Sync boost prices to ad prices
      const e1 = await upsert("boost_silver_price", values["silver_price"] || "0");
      if (e1) errors.push(`boost_silver_price: ${e1}`);
      const e2 = await upsert("boost_gold_price", values["gold_price"] || "0");
      if (e2) errors.push(`boost_gold_price: ${e2}`);
      for (const { key } of CAMPAIGN_PRICE_KEYS) {
        const e = await upsert(key, values[key] || "0");
        if (e) errors.push(`${key}: ${e}`);
      }

      // Admin flat-price override
      const eFlatEn = await upsert(
        "admin_flat_price_enabled",
        values["admin_flat_price_enabled"] === "false" ? "false" : "true",
      );
      if (eFlatEn) errors.push(`admin_flat_price_enabled: ${eFlatEn}`);
      const eFlatAmt = await upsert(
        "admin_flat_price_amount",
        values["admin_flat_price_amount"] || "5",
      );
      if (eFlatAmt) errors.push(`admin_flat_price_amount: ${eFlatAmt}`);

      if (errors.length) {
        toast({
          title: "Some prices failed to save",
          description: errors[0],
          variant: "destructive",
        });
      } else {
        toast({ title: "Pricing updated", description: "New prices are live." });
      }

      // Reload to confirm + bust local state
      await reload();
    } catch (err: any) {
      toast({ title: "Failed to save", description: err?.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Admin Flat Price (Test Mode)</h3>
            <p className="text-xs text-muted-foreground">
              When enabled, every payment initiated by an admin account is forced to this amount.
              Regular users continue to pay normal prices.
            </p>
          </div>
          <Switch
            checked={values["admin_flat_price_enabled"] !== "false"}
            onCheckedChange={(checked) =>
              setValues((prev) => ({ ...prev, admin_flat_price_enabled: checked ? "true" : "false" }))
            }
          />
        </div>
        <div className="max-w-[200px]">
          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Flat amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
            <Input
              type="number"
              inputMode="numeric"
              value={values["admin_flat_price_amount"] ?? "5"}
              onChange={(e) => setValues((prev) => ({ ...prev, admin_flat_price_amount: e.target.value }))}
              className="pl-12 h-10"
              min={1}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Ad Listing Prices</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Set KSh prices for Silver and Gold ad packages. Boost prices sync automatically.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {AD_PRICE_KEYS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={values[key] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="pl-12 h-10"
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Campaign Banner Prices</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Set KSh prices for banner campaign packages shown on the Advertise page.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAMPAIGN_PRICE_KEYS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={values[key] || ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="pl-12 h-10"
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="h-10">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save All Pricing
      </Button>
    </div>
  );
};

export default AdminPricing;
