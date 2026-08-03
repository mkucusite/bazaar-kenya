import { useEffect, useRef, useState } from "react";
import { Rocket, Loader2, Phone, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { initiatePayment, verifyPayment } from "@/lib/payments";

interface BoostPoliticianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  politician: {
    slug: string;
    name: string;
    bio?: string;
    photo?: string | null;
    cover?: string | null;
    position?: string;
    region?: string;
    county?: string;
    party_name?: string;
    tagline?: string;
  } | null;
  onBoosted?: (until: string) => void;
}

type PayState = "idle" | "paying" | "polling" | "success" | "failed";

const PRESETS = [
  { amount: 3000, label: "Starter", reach: "≈15k impressions" },
  { amount: 5000, label: "Campaign", reach: "≈35k impressions" },
  { amount: 10000, label: "Premier", reach: "≈90k + county hero" },
];

const BoostPoliticianDialog = ({ open, onOpenChange, politician, onBoosted }: BoostPoliticianDialogProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(5000);
  const [phone, setPhone] = useState("");
  const [payState, setPayState] = useState<PayState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => clearPoll(), []);

  useEffect(() => {
    if (!open) { clearPoll(); setPayState("idle"); return; }
    if (!user) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [open, user]);

  const handleBoost = async () => {
    if (!politician) return;
    if (!phone || phone.trim().length < 9) { toast.error("Enter a valid M-Pesa phone number"); return; }

    setPayState("paying");
    try {
      const profileUrl = `https://www.kenyaadverts.com/politicians/${politician.slug}`;
      const result = await initiatePayment({
        phone: phone.trim(),
        amount,
        package_type: "politician_promotion",
        user_id: user?.id,
        campaign: {
          business_name: politician.name,
          description: politician.bio || `${politician.name} political profile.`,
          target_url: profileUrl,
          banner_image: politician.photo || politician.cover || "/og-image.png",
          county: politician.county || politician.region || null,
          running_position: politician.position || null,
          party_name: politician.party_name || null,
          slogan: politician.tagline || null,
        },
      });
      if (!result?.success) throw new Error(result?.error || "Payment failed");


      toast.success("STK Push sent. Enter your M-Pesa PIN.");
      setPayState("polling");

      const txId = result.transaction_id;
      let attempts = 0;
      clearPoll();
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const v = await verifyPayment(txId);
          if (v?.status === "completed") {
            clearPoll();
            setPayState("success");
            const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            toast.success("Profile boosted for 30 days!");
            setTimeout(() => { onBoosted?.(until); onOpenChange(false); }, 1500);
          } else if (v?.status === "failed" || attempts >= 30) {
            clearPoll();
            setPayState("failed");
            toast.error("Payment was not completed.");
          }
        } catch {
          if (attempts >= 30) { clearPoll(); setPayState("failed"); }
        }
      }, 5000);
    } catch (err: any) {
      setPayState("failed");
      toast.error(err?.message || "Payment error");
    }
  };

  const isProcessing = payState === "paying" || payState === "polling";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) clearPoll(); onOpenChange(v); }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8 px-4">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Rocket className="w-5 h-5 text-primary" /> Boost Campaign Profile
          </SheetTitle>
          <SheetDescription className="text-sm">
            Promote <span className="font-medium text-foreground">"{politician?.name}"</span> for 30 days across {politician?.county || politician?.region || "Kenya"}.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.amount}
              type="button"
              onClick={() => setAmount(p.amount)}
              disabled={isProcessing}
              className={`rounded-xl border-2 px-2 py-3 text-left transition ${
                amount === p.amount ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{p.label}</div>
              <div className="text-sm font-bold">KSh {p.amount.toLocaleString()}</div>
              <div className="mt-1 text-[10px] opacity-70">{p.reach}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" /> Higher boost = higher placement & wider county reach.
        </p>

        <div className="mt-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">M-Pesa Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" className="pl-10 h-12" disabled={isProcessing} />
          </div>
        </div>

        {payState === "polling" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm text-foreground">Waiting for M-Pesa confirmation…</p>
          </div>
        )}
        {payState === "success" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Payment confirmed! Boosting…</p>
          </div>
        )}
        {payState === "failed" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">Payment was not completed. Try again.</p>
          </div>
        )}

        <Button onClick={handleBoost} disabled={isProcessing || payState === "success"} className="w-full h-12 mt-5 text-base font-semibold" size="lg">
          {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />{payState === "polling" ? "Waiting…" : "Processing…"}</>) : (<><Rocket className="w-4 h-4 mr-2" />Pay KSh {amount.toLocaleString()} via M-Pesa</>)}
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default BoostPoliticianDialog;
