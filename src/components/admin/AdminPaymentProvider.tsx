import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Zap,
} from "lucide-react";
import { testPalplussConnection } from "@/lib/payments";

type Provider = "palpluss" | "payhero";

const AdminPaymentProvider = () => {
  const [provider, setProvider] = useState<Provider>("palpluss");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // PalPluss Credentials State
  const [palplussApiKey, setPalplussApiKey] = useState("");
  const [palplussChannelId, setPalplussChannelId] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: providerRow } = await supabase
          .from("admin_settings" as any)
          .select("value")
          .eq("key", "payment_provider")
          .maybeSingle();

        const v = (providerRow as any)?.value as string | undefined;
        if (v === "payhero" || v === "palpluss") setProvider(v);

        // Load PalPluss settings
        const { data: keyRow } = await supabase
          .from("admin_settings" as any)
          .select("value")
          .eq("key", "palpluss_api_key")
          .maybeSingle();
        if ((keyRow as any)?.value) setPalplussApiKey((keyRow as any).value);

        const { data: channelRow } = await supabase
          .from("admin_settings" as any)
          .select("value")
          .eq("key", "palpluss_channel_id")
          .maybeSingle();
        if ((channelRow as any)?.value) setPalplussChannelId((channelRow as any).value);
      } catch (err) {
        console.error("Error loading payment settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProvider = async (next: Provider) => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings" as any)
      .upsert(
        { key: "payment_provider", value: next, updated_at: new Date().toISOString() } as any,
        { onConflict: "key" } as any
      );
    setSaving(false);
    if (error) {
      toast({ title: "Could not save provider", description: error.message, variant: "destructive" });
      return;
    }
    setProvider(next);
    toast({ title: `Active gateway: ${next === "palpluss" ? "PalPluss" : "PayHero"}` });
  };

  const savePalplussSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "palpluss_api_key", value: palplussApiKey.trim(), updated_at: new Date().toISOString() },
        { key: "palpluss_channel_id", value: palplussChannelId.trim(), updated_at: new Date().toISOString() },
        { key: "payment_provider", value: "palpluss", updated_at: new Date().toISOString() },
      ];

      for (const item of updates) {
        await supabase
          .from("admin_settings" as any)
          .upsert(item as any, { onConflict: "key" } as any);
      }

      setProvider("palpluss");
      toast({ title: "PalPluss Settings Saved", description: "Your API credentials have been saved securely." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Could not save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!palplussApiKey.trim()) {
      toast({ title: "API Key Required", description: "Please enter your PalPluss API key to test.", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testPalplussConnection(palplussApiKey.trim());
      setTestResult({
        success: true,
        message: res.message || `Connected! Service Wallet Balance: KES ${res.balance}`,
        balance: res.balance,
      });
      toast({ title: "Connection Successful!", description: `Service Wallet: KES ${res.balance}` });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to reach PalPluss. Check your API key.",
      });
      toast({ title: "Connection Failed", description: err?.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const callbackUrl = "https://www.kenyaadverts.com/api/payment-callback";

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    toast({ title: "Copied Callback URL", description: callbackUrl });
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading payment gateway…
      </div>
    );
  }

  const Option = ({ id, title, desc }: { id: Provider; title: string; desc: string }) => {
    const active = provider === id;
    return (
      <button
        type="button"
        onClick={() => !active && saveProvider(id)}
        disabled={saving || active}
        className={`text-left rounded-xl border p-4 transition-all ${
          active
            ? "border-primary bg-primary/10 ring-2 ring-primary/40"
            : "border-border hover:border-primary/40 hover:bg-muted/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">{title}</span>
          {active && (
            <span className="text-[10px] font-bold uppercase tracking-wide bg-primary text-primary-foreground px-2 py-0.5 rounded">
              Active
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">M-Pesa Payment Gateway</h3>
          <p className="text-xs text-muted-foreground">
            Configure PalPluss (https://www.palpluss.com/) for automated M-Pesa STK Pushes and checkouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Option
          id="palpluss"
          title="PalPluss (Default & Active)"
          desc="Modern M-Pesa gateway via api.palpluss.com. Instant STK push & real-time webhook callback."
        />
        <Option
          id="payhero"
          title="PayHero (Legacy)"
          desc="Original gateway via backend.payhero.co.ke."
        />
      </div>

      {provider === "palpluss" && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm text-foreground">PalPluss API Configuration</h4>
            </div>
            <a
              href="https://console.palpluss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              PalPluss Console <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold">PalPluss API Key (Secret Key)</Label>
              <div className="relative mt-1">
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={palplussApiKey}
                  onChange={(e) => setPalplussApiKey(e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Obtain your API Key from{" "}
                <a
                  href="https://console.palpluss.com/settings/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-foreground"
                >
                  console.palpluss.com → Settings → API Keys
                </a>.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Payment Channel ID (Optional)</Label>
              <Input
                type="text"
                placeholder="Leave blank to use account's default channel"
                value={palplussChannelId}
                onChange={(e) => setPalplussChannelId(e.target.value)}
                className="font-mono text-xs mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                If you have a default Till or Paybill selected in PalPluss, you can leave this empty.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Live Webhook Callback URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  readOnly
                  value={callbackUrl}
                  className="font-mono text-xs bg-muted/60"
                />
                <Button variant="outline" size="sm" onClick={copyCallbackUrl} className="gap-1 text-xs">
                  <Copy className="w-3.5 h-3.5" /> Copy
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Automatically included in each payment request. Also add this to PalPluss Console → Webhooks.
              </p>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
              )}
              <div className="leading-relaxed">
                <p className="font-semibold">{testResult.success ? "Connection Verified" : "Connection Error"}</p>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !palplussApiKey.trim()}
              className="gap-1.5"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Test Connection
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={savePalplussSettings}
              disabled={saving}
              className="gap-1.5 font-semibold"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save PalPluss Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentProvider;
