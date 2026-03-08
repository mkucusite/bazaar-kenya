import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

type ConfigRow = { id: string; key: string; value: string };

const PRICE_KEYS = [
  { key: "silver_price", label: "Silver Package — KSh" },
  { key: "gold_price", label: "Gold Package — KSh" },
];

const AdminPricing = () => {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_config" as any)
        .select("id, key, value");
      if (data) {
        setConfigs(data as unknown as ConfigRow[]);
        const map: Record<string, string> = {};
        for (const row of data as unknown as ConfigRow[]) map[row.key] = row.value;
        setValues(map);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const { key } of PRICE_KEYS) {
        const existing = configs.find(c => c.key === key);
        const newVal = values[key] || "0";
        if (existing) {
          if (newVal !== existing.value) {
            await (supabase.from("site_config" as any) as any)
              .update({ value: newVal, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
          }
        } else {
          await (supabase.from("site_config" as any) as any)
            .insert({ key, value: newVal });
        }
      }
      // Also sync boost prices to match
      for (const boostKey of ["boost_silver_price", "boost_gold_price"]) {
        const baseKey = boostKey.replace("boost_", "");
        const existing = configs.find(c => c.key === boostKey);
        const newVal = values[baseKey] || "0";
        if (existing) {
          await (supabase.from("site_config" as any) as any)
            .update({ value: newVal, updated_at: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await (supabase.from("site_config" as any) as any)
            .insert({ key: boostKey, value: newVal });
        }
      }
      toast({ title: "Pricing updated!" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
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
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Set the KSh prices for Silver and Gold packages. Boost prices will sync automatically.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {PRICE_KEYS.map(({ key, label }) => (
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

      <Button onClick={handleSave} disabled={saving} className="h-10">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Pricing
      </Button>
    </div>
  );
};

export default AdminPricing;
