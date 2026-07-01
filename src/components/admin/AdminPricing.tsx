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

const POLITICIAN_PRICE_KEYS = [
  { key: "politician_claim_price", label: "Politician Claim Price", default: "10000" },
];

const CAMPAIGN_PRICE_KEYS = [
  { key: "campaign_basic_banner_price", label: "Basic Banner" },
  { key: "campaign_featured_business_price", label: "Featured Business" },
  { key: "campaign_category_sponsor_price", label: "Category Sponsor" },
];

const BOOST_KEYS = [
  { key: "boost_event_min", label: "Event Boost Min", default: "500" },
  { key: "boost_event_max", label: "Event Boost Max", default: "1000" },
  { key: "boost_banner_min", label: "Poster/Banner Boost Min", default: "500" },
  { key: "boost_banner_max", label: "Poster/Banner Boost Max", default: "1000" },
  { key: "boost_politics_min", label: "Politics Boost Min", default: "1000" },
  { key: "boost_politics_max", label: "Politics Boost Max", default: "5000" },
];

const POSTING_FEE_KEYS = [
  { key: "post_event_fee", label: "Event Posting Fee", default: "0" },
  { key: "post_banner_fee", label: "Poster/Banner Posting Fee", default: "0" },
  { key: "post_politics_fee", label: "Politics Posting Fee", default: "0" },
];

const PAYMENT_REQUIRED_KEYS = [
  { key: "require_payment_event", label: "Require payment before posting Events" },
  { key: "require_payment_banner", label: "Require payment before posting Posters/Banners" },
  { key: "require_payment_politics", label: "Require payment before posting Politics" },
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

      // Boost amounts (event / banner / politics)
      for (const { key, default: def } of BOOST_KEYS) {
        const e = await upsert(key, values[key] || def);
        if (e) errors.push(`${key}: ${e}`);
      }
      // Posting fees
      for (const { key, default: def } of POSTING_FEE_KEYS) {
        const e = await upsert(key, values[key] || def);
        if (e) errors.push(`${key}: ${e}`);
      }
      // Require-payment-before-posting toggles
      for (const { key } of PAYMENT_REQUIRED_KEYS) {
        const e = await upsert(key, values[key] === "true" ? "true" : "false");
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

      // Politician pricing
      for (const { key, default: def } of POLITICIAN_PRICE_KEYS) {
        const e = await upsert(key, values[key] || def);
        if (e) errors.push(`${key}: ${e}`);
      }

      // Politician contact settings (text/toggle)
      const contactKeys: Array<[string, string]> = [
        ["politician_contact_email", values["politician_contact_email"] || "hydrocephcare@gmail.com"],
        ["politician_contact_whatsapp", values["politician_contact_whatsapp"] || "0115475543"],
        ["politician_show_whatsapp", values["politician_show_whatsapp"] === "false" ? "false" : "true"],
        ["politician_show_website_offer", values["politician_show_website_offer"] === "false" ? "false" : "true"],
      ];
      for (const [k, v] of contactKeys) {
        const e = await upsert(k, v);
        if (e) errors.push(`${k}: ${e}`);
      }

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

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Politician Profiles — Pricing & Contact</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Claim price and the "Need a website?" contact card that appears on every politician page.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {POLITICIAN_PRICE_KEYS.map(({ key, label, default: def }) => (
            <div key={key}>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={values[key] ?? def}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="pl-12 h-10"
                  min={0}
                />
              </div>
            </div>
          ))}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Email</Label>
            <Input
              type="email"
              value={values["politician_contact_email"] ?? "hydrocephcare@gmail.com"}
              onChange={(e) => setValues((prev) => ({ ...prev, politician_contact_email: e.target.value }))}
              className="h-10"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp Number</Label>
            <Input
              type="tel"
              value={values["politician_contact_whatsapp"] ?? "0115475543"}
              onChange={(e) => setValues((prev) => ({ ...prev, politician_contact_whatsapp: e.target.value }))}
              className="h-10"
              placeholder="0712345678"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <Label className="text-sm font-medium text-foreground">Show WhatsApp icon on politician pages</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Turn off to hide the green WhatsApp button.</p>
            </div>
            <Switch
              checked={values["politician_show_whatsapp"] !== "false"}
              onCheckedChange={(checked) =>
                setValues((prev) => ({ ...prev, politician_show_whatsapp: checked ? "true" : "false" }))
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
            <div>
              <Label className="text-sm font-medium text-foreground">Show "Need a website?" offer</Label>
              <p className="text-xs text-muted-foreground mt-0.5">The full website-creation CTA on each politician profile.</p>
            </div>
            <Switch
              checked={values["politician_show_website_offer"] !== "false"}
              onCheckedChange={(checked) =>
                setValues((prev) => ({ ...prev, politician_show_website_offer: checked ? "true" : "false" }))
              }
            />
          </div>
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

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">Boost Amounts</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Min/Max boost (KSh) for Events, Posters/Banners, and Politics campaigns.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {BOOST_KEYS.map(({ key, label, default: def }) => (
            <div key={key}>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={values[key] ?? def}
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
        <h3 className="text-sm font-semibold text-foreground mb-1">Posting Fees</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Optional fee charged when posting each item type. Set to 0 to keep posting free.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {POSTING_FEE_KEYS.map(({ key, label, default: def }) => (
            <div key={key}>
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">KSh</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={values[key] ?? def}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="pl-12 h-10"
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Payment Before Posting</h3>
        <p className="text-xs text-muted-foreground mb-3">
          When ON, the user must complete M-Pesa payment of the posting fee before their item is published.
        </p>
        <div className="space-y-3">
          {PAYMENT_REQUIRED_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <Label className="text-sm font-medium text-foreground">{label}</Label>
              <Switch
                checked={values[key] === "true"}
                onCheckedChange={(checked) =>
                  setValues((prev) => ({ ...prev, [key]: checked ? "true" : "false" }))
                }
              />
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
