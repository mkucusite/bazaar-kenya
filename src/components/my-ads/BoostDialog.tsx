import { useState, useEffect } from "react";
import { Crown, Loader2, Coins, Phone, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import type { ManagedAd } from "./types";

interface BoostDialogProps {
  open: boolean;
  ad: ManagedAd | null;
  tier: "silver" | "gold";
  onOpenChange: (open: boolean) => void;
  onBoosted: (ad: ManagedAd) => void;
}

const tierConfig = {
  silver: {
    label: "Silver",
    price: 2,
    icon: "🥈",
    perks: ["Priority listing", "Silver badge", "7-day boost"],
  },
  gold: {
    label: "Gold",
    price: 5,
    icon: "🥇",
    perks: ["Top placement", "Gold badge", "14-day boost", "Featured section"],
  },
};

type PayState = "idle" | "paying" | "polling" | "success" | "failed";

const BoostDialog = ({ open, ad, tier, onOpenChange, onBoosted }: BoostDialogProps) => {
  const { user } = useAuth();
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [phone, setPhone] = useState("");
  const [payState, setPayState] = useState<PayState>("idle");
  const [selectedTier, setSelectedTier] = useState(tier);

  const config = tierConfig[selectedTier];
  const discount = useCredits ? Math.min(creditsBalance, config.price) : 0;
  const finalPrice = config.price - discount;

  useEffect(() => {
    setSelectedTier(tier);
  }, [tier]);

  useEffect(() => {
    if (!open) {
      setPayState("idle");
      setUseCredits(false);
      return;
    }
    if (!user) return;

    // Fetch credits
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCreditsBalance(data?.balance ?? 0));

    // Fetch phone from profile
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.phone) setPhone(data.phone);
      });
  }, [open, user]);

  const handleBoost = async () => {
    if (!ad || !user) return;

    // Deduct credits first if applicable
    if (useCredits && discount > 0) {
      const { error: creditError } = await supabase
        .from("credits")
        .update({ balance: creditsBalance - discount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (creditError) {
        toast({ title: "Failed to deduct credits", variant: "destructive" });
        return;
      }
      setCreditsBalance((prev) => prev - discount);
    }

    // If fully covered by credits, upgrade directly
    if (finalPrice <= 0) {
      setPayState("paying");
      const { data, error } = await supabase
        .from("ads")
        .update({ badge: selectedTier, updated_at: new Date().toISOString() })
        .eq("id", ad.id)
        .select()
        .single();

      if (error) {
        toast({ title: "Upgrade failed", description: error.message, variant: "destructive" });
        setPayState("idle");
        return;
      }

      setPayState("success");
      toast({ title: `Ad boosted to ${config.label}!` });
      setTimeout(() => {
        onBoosted(data as ManagedAd);
        onOpenChange(false);
      }, 1200);
      return;
    }

    // M-Pesa payment required
    if (!phone || phone.trim().length < 9) {
      toast({ title: "Enter a valid M-Pesa phone number", variant: "destructive" });
      return;
    }

    setPayState("paying");

    try {
      const result = await initiatePayment({
        phone: phone.trim(),
        amount: finalPrice,
        package_type: selectedTier,
        ad_id: ad.id,
        user_id: user.id,
      });

      if (!result?.success) {
        throw new Error(result?.error || "Payment initiation failed");
      }

      toast({ title: "STK Push sent!", description: "Check your phone and enter your M-Pesa PIN." });
      setPayState("polling");

      // Poll for payment status
      const txId = result.transaction_id;
      let attempts = 0;
      const maxAttempts = 30;

      const poll = setInterval(async () => {
        attempts++;
        try {
          const verification = await verifyPayment(txId);
          if (verification?.status === "completed") {
            clearInterval(poll);
            setPayState("success");
            toast({ title: `Ad boosted to ${config.label}!`, description: "Payment confirmed." });

            // Refresh ad data
            const { data: updatedAd } = await supabase
              .from("ads")
              .select("*")
              .eq("id", ad.id)
              .single();

            setTimeout(() => {
              if (updatedAd) onBoosted(updatedAd as ManagedAd);
              onOpenChange(false);
            }, 1500);
          } else if (verification?.status === "failed") {
            clearInterval(poll);
            setPayState("failed");
            toast({ title: "Payment failed", description: "The M-Pesa transaction was not completed.", variant: "destructive" });
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPayState("failed");
            toast({ title: "Payment timeout", description: "We didn't receive confirmation. Check your M-Pesa and try again.", variant: "destructive" });
          }
        } catch {
          if (attempts >= maxAttempts) {
            clearInterval(poll);
            setPayState("failed");
          }
        }
      }, 5000);
    } catch (err: any) {
      setPayState("failed");
      toast({ title: "Payment error", description: err?.message || "Something went wrong", variant: "destructive" });
    }
  };

  const isProcessing = payState === "paying" || payState === "polling";

  return (
    <Sheet open={open} onOpenChange={(v) => !isProcessing && onOpenChange(v)}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-8">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Crown className={`w-5 h-5 ${selectedTier === "gold" ? "text-yellow-500" : "text-muted-foreground"}`} />
            Boost Your Ad
          </SheetTitle>
          <SheetDescription className="text-sm">
            Upgrade <span className="font-medium text-foreground">"{ad?.title}"</span> for more visibility
          </SheetDescription>
        </SheetHeader>

        {/* Tier selector */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {(["silver", "gold"] as const).map((t) => {
            const tc = tierConfig[t];
            const isSelected = selectedTier === t;
            return (
              <button
                key={t}
                onClick={() => !isProcessing && setSelectedTier(t)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? t === "gold"
                      ? "border-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20 shadow-sm"
                      : "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle2 className={`w-5 h-5 ${t === "gold" ? "text-yellow-500" : "text-primary"}`} />
                  </div>
                )}
                <span className="text-2xl">{tc.icon}</span>
                <p className="font-heading font-bold text-foreground mt-1">{tc.label}</p>
                <p className="text-lg font-bold text-primary">KSh {tc.price}</p>
                <ul className="mt-2 space-y-1">
                  {tc.perks.map((p) => (
                    <li key={p} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary/60" /> {p}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Credits section - always visible */}
        <div className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Credits Balance</span>
            </div>
            <span className="text-sm font-bold text-foreground">{creditsBalance}</span>
          </div>

          {creditsBalance > 0 ? (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
              <span className="text-sm text-muted-foreground">
                Apply {discount} credit{discount !== 1 ? "s" : ""} (−KSh {discount})
              </span>
              <Switch checked={useCredits} onCheckedChange={setUseCredits} disabled={isProcessing} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mt-2">No credits available. You can buy credits from the Credits page.</p>
          )}
        </div>

        {/* Price summary */}
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-sm text-muted-foreground">Total to pay</span>
          <div className="text-right">
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through mr-2">KSh {config.price}</span>
            )}
            <span className="text-xl font-bold text-foreground">
              {finalPrice > 0 ? `KSh ${finalPrice}` : "Free"}
            </span>
          </div>
        </div>

        {/* Phone input for M-Pesa (only if payment needed) */}
        {finalPrice > 0 && (
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
        )}

        {/* Status indicators */}
        {payState === "polling" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Waiting for M-Pesa confirmation…</p>
              <p className="text-xs text-muted-foreground">Enter your PIN on your phone</p>
            </div>
          </div>
        )}

        {payState === "success" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Payment confirmed! Boosting your ad…</p>
          </div>
        )}

        {payState === "failed" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm font-medium text-destructive">Payment was not completed. Try again.</p>
          </div>
        )}

        {/* Action button */}
        <Button
          onClick={handleBoost}
          disabled={isProcessing || payState === "success"}
          className={`w-full h-12 mt-5 text-base font-semibold ${
            selectedTier === "gold"
              ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
              : ""
          }`}
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {payState === "polling" ? "Waiting for payment…" : "Processing…"}
            </>
          ) : payState === "failed" ? (
            "Try Again"
          ) : (
            <>
              <Crown className="w-4 h-4 mr-2" />
              {finalPrice > 0 ? `Pay KSh ${finalPrice} via M-Pesa` : `Boost to ${config.label}`}
            </>
          )}
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default BoostDialog;
