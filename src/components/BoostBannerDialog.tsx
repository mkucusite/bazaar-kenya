import { useEffect, useRef, useState } from "react";
import { Rocket, Loader2, Phone, CheckCircle2, XCircle, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { initiatePayment, verifyPayment } from "@/lib/payments";

interface BoostBannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: { id: string; title: string; isPolitician?: boolean } | null;
  onBoosted?: () => void;
}

type PayState = "idle" | "paying" | "polling" | "success" | "failed";

const POLITICAL_PRESETS = [1000, 3000, 5000];
const STANDARD_PRESETS = [500, 750, 1000];

const BoostBannerDialog = ({ open, onOpenChange, banner, onBoosted }: BoostBannerDialogProps) => {
  const { user } = useAuth();
  const isPolitician = banner?.isPolitician ?? false;
  const PRESETS = isPolitician ? POLITICAL_PRESETS : STANDARD_PRESETS;
  const MAX_AMOUNT = isPolitician ? 5000 : 1000;
  const MIN_AMOUNT = isPolitician ? 1000 : 500;

  const [amount, setAmount] = useState<number>(PRESETS[0]);
  const [phone, setPhone] = useState("");
  const [payState, setPayState] = useState<PayState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => clearPoll(), []);

  useEffect(() => {
    if (!open) { clearPoll(); setPayState("idle"); return; }
    // Reset amount when opening based on type
    setAmount(isPolitician ? POLITICAL_PRESETS[0] : STANDARD_PRESETS[0]);
    if (!user) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [open, user, isPolitician]);

  const handleBoost = async () => {
    if (!banner) return;
    if (!phone || phone.trim().length < 9) { toast.error("Enter a valid M-Pesa phone number"); return; }

    setPayState("paying");
    try {
      const result = await initiatePayment({
        phone: phone.trim(),
        amount,
        package_type: isPolitician ? "campaign_boost" : "banner_boost",
        banner_id: banner.id,
        user_id: user?.id ?? null,
      } as any);
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
            toast.success(isPolitician ? "Campaign boosted for 30 days!" : "Banner boosted for 30 days!");
            setTimeout(() => { onBoosted?.(); onOpenChange(false); }, 1500);
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
            {isPolitician ? (
              <span className="inline-flex items-center justify-center rounded-lg bg-orange-500 p-1.5">
                <Rocket className="w-4 h-4 text-white" />
              </span>
            ) : (
              <Rocket className="w-5 h-5 text-primary" />
            )}
            {isPolitician ? "Boost Your Campaign" : "Boost This Banner"}
          </SheetTitle>
          <SheetDescription className="text-sm">
            Promote{" "}
            <span className="font-medium text-foreground">"{banner?.title}"</span>{" "}
            for 30 days.{" "}
            {isPolitician
              ? "KSh 1,000 – 5,000. Higher spend = top placement."
              : "KSh 500 – 1,000."}
          </SheetDescription>
        </SheetHeader>

        {/* Tier selector */}
        <div className={`mt-4 grid gap-2 ${isPolitician ? "grid-cols-3" : "grid-cols-3"}`}>
          {PRESETS.map((p, i) => {
            const labels = isPolitician
              ? ["Starter", "Popular", "Top Tier"]
              : ["Basic", "Standard", "Premium"];
            const isSelected = amount === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                disabled={isProcessing}
                className={`relative rounded-xl border-2 px-2 py-3 text-sm font-bold transition-all duration-150 ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {isPolitician && i === 1 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-wide">
                    Popular
                  </span>
                )}
                <div className="text-base font-black">KSh {p.toLocaleString()}</div>
                <div className="text-[10px] font-medium opacity-60 mt-0.5">{labels[i]}</div>
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-primary" />
          {isPolitician
            ? "Higher boost = top placement in politics feed for 30 days."
            : "Higher boost = higher placement for 30 days."}
        </p>

        {/* Reach estimate */}
        {isPolitician && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20 px-3 py-2.5">
            <Zap className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-700 dark:text-orange-400 font-medium">
              Est. reach:{" "}
              <span className="font-black">
                {amount === 1000 ? "5,000–10,000" : amount === 3000 ? "20,000–40,000" : "60,000–100,000"}
              </span>{" "}
              Kenyan voters
            </p>
          </div>
        )}

        {/* Phone input */}
        <div className="mt-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">M-Pesa Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712345678"
              className="pl-10 h-12"
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Status states */}
        {payState === "polling" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
            <p className="text-sm text-foreground">Waiting for M-Pesa confirmation…</p>
          </div>
        )}
        {payState === "success" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Payment confirmed! {isPolitician ? "Campaign" : "Banner"} is being boosted…
            </p>
          </div>
        )}
        {payState === "failed" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
            <XCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">Payment was not completed. Try again.</p>
          </div>
        )}

        {/* Pay button */}
        <Button
          onClick={handleBoost}
          disabled={isProcessing || amount < MIN_AMOUNT || amount > MAX_AMOUNT || payState === "success"}
          className="w-full h-12 mt-5 text-base font-semibold"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {payState === "polling" ? "Waiting for PIN…" : "Processing…"}
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4 mr-2" />
              Pay KSh {amount.toLocaleString()} via M-Pesa
            </>
          )}
        </Button>

        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Secure payment via M-Pesa STK Push. No card required.
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default BoostBannerDialog;
