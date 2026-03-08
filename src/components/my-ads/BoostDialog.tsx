import { useState, useEffect } from "react";
import { Crown, Loader2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ManagedAd } from "./types";

interface BoostDialogProps {
  open: boolean;
  ad: ManagedAd | null;
  tier: "silver" | "gold";
  onOpenChange: (open: boolean) => void;
  onBoosted: (ad: ManagedAd) => void;
}

const tierConfig = {
  silver: { label: "Silver", price: 299, color: "text-muted-foreground", bg: "bg-muted/60" },
  gold: { label: "Gold", price: 499, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/20" },
};

const BoostDialog = ({ open, ad, tier, onOpenChange, onBoosted }: BoostDialogProps) => {
  const { user } = useAuth();
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = tierConfig[tier];
  const discount = useCredits ? Math.min(creditsBalance, config.price) : 0;
  const finalPrice = config.price - discount;

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCreditsBalance(data?.balance ?? 0));
  }, [open, user]);

  const handleBoost = async () => {
    if (!ad || !user) return;
    setLoading(true);

    // Deduct credits if used
    if (useCredits && discount > 0) {
      const { error: creditError } = await supabase
        .from("credits")
        .update({ balance: creditsBalance - discount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (creditError) {
        toast({ title: "Failed to deduct credits", variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    // If there's still a remaining price, we'd normally initiate payment
    // For now, if fully covered by credits, upgrade directly
    if (finalPrice > 0) {
      toast({ title: `KSh ${finalPrice} payment required`, description: "M-Pesa payment flow coming soon for partial payments." });
      setLoading(false);
      return;
    }

    // Upgrade the ad badge
    const { data, error } = await supabase
      .from("ads")
      .update({ badge: tier, updated_at: new Date().toISOString() })
      .eq("id", ad.id)
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({ title: "Upgrade failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: `Ad boosted to ${config.label}!` });
    onBoosted(data as ManagedAd);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${tier === "gold" ? "text-yellow-500" : "text-muted-foreground"}`} />
            Boost to {config.label}
          </DialogTitle>
          <DialogDescription>
            Upgrade "{ad?.title}" to {config.label} for more visibility.
          </DialogDescription>
        </DialogHeader>

        <div className={`rounded-xl p-4 ${config.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">{config.label} Package</span>
            <span className={`text-lg font-bold ${config.color}`}>KSh {config.price}</span>
          </div>

          {creditsBalance > 0 && (
            <div className="flex items-center justify-between py-3 border-t border-border/60">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Use {discount} credit{discount !== 1 ? "s" : ""}</span>
                <span className="text-xs text-muted-foreground">({creditsBalance} available)</span>
              </div>
              <Switch checked={useCredits} onCheckedChange={setUseCredits} />
            </div>
          )}

          {useCredits && discount > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-sm text-muted-foreground">After credits</span>
              <span className="text-lg font-bold text-primary">
                {finalPrice > 0 ? `KSh ${finalPrice}` : "Free!"}
              </span>
            </div>
          )}
        </div>

        <Button onClick={handleBoost} disabled={loading} className="w-full h-11 mt-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Crown className="w-4 h-4 mr-2" />
          )}
          {finalPrice > 0 ? `Pay KSh ${finalPrice}` : `Boost to ${config.label}`}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BoostDialog;
