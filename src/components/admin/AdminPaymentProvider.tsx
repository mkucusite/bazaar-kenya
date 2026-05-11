import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard } from "lucide-react";

type Provider = "palpluss" | "payhero";

const AdminPaymentProvider = () => {
  const [provider, setProvider] = useState<Provider>("palpluss");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admin_settings" as any)
        .select("value")
        .eq("key", "payment_provider")
        .maybeSingle();
      const v = (data as any)?.value as string | undefined;
      if (v === "payhero" || v === "palpluss") setProvider(v);
      setLoading(false);
    })();
  }, []);

  const save = async (next: Provider) => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings" as any)
      .upsert(
        { key: "payment_provider", value: next, updated_at: new Date().toISOString() } as any,
        { onConflict: "key" } as any,
      );
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    setProvider(next);
    toast({ title: `Active gateway: ${next === "palpluss" ? "PalPluss" : "PayHero"}` });
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
        onClick={() => !active && save(id)}
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
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">M-Pesa Payment Gateway</h3>
          <p className="text-xs text-muted-foreground">
            Switch between providers. Changes apply instantly to all checkouts.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Option
          id="palpluss"
          title="PalPluss (default)"
          desc="New gateway. Direct M-Pesa STK push via api.palpluss.com."
        />
        <Option
          id="payhero"
          title="PayHero"
          desc="Original gateway. STK push via backend.payhero.co.ke."
        />
      </div>
      {saving && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
};

export default AdminPaymentProvider;
