import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { initiatePayment } from "@/lib/payments";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  price: number;
  userId?: string;
  onPaid: () => void;
}

/** M-Pesa gate for paid digital products — unlocks the download once the STK push is confirmed. */
const BuyProductDialog = ({ open, onOpenChange, productId, productTitle, price, userId, onPaid }: Props) => {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const poll = (transactionId: string) => {
    setWaiting(true);
    let ticks = 0;
    timer.current = setInterval(async () => {
      ticks += 1;
      const { data } = await supabase
        .from("payments")
        .select("payment_status")
        .eq("transaction_id", transactionId)
        .maybeSingle();

      if (data?.payment_status === "completed" || data?.payment_status === "success") {
        if (timer.current) clearInterval(timer.current);
        setWaiting(false);
        toast({ title: "Payment received", description: "Your download is now unlocked." });
        onPaid();
        onOpenChange(false);
        return;
      }
      if (data?.payment_status === "failed" || ticks > 40) {
        if (timer.current) clearInterval(timer.current);
        setWaiting(false);
        toast({
          title: ticks > 40 ? "Still waiting for M-Pesa" : "Payment failed",
          description: "If you were charged, refresh this page in a moment.",
          variant: "destructive",
        });
      }
    }, 3000);
  };

  const pay = async () => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 9) {
      toast({ title: "Enter a valid M-Pesa number", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await initiatePayment({
        phone: clean,
        amount: price,
        package_type: "digital_product",
        product_id: productId,
        user_id: userId,
      });
      toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to complete the purchase." });
      if (res?.transaction_id || res?.payment?.transaction_id) {
        poll(res.transaction_id || res.payment.transaction_id);
      }
    } catch (e: any) {
      toast({ title: "Payment failed", description: e?.message || "Try again", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Pay KSh {price.toLocaleString()} to download</DialogTitle>
          <DialogDescription className="text-xs">{productTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">M-Pesa phone number</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                inputMode="numeric"
                className="pl-9"
              />
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            You will get an STK push instantly. The download unlocks automatically once M-Pesa confirms the payment.
          </p>

          <Button onClick={pay} disabled={busy || waiting} className="h-11 w-full">
            {busy || waiting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {waiting ? "Waiting for M-Pesa…" : busy ? "Sending request…" : `Pay KSh ${price.toLocaleString()}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyProductDialog;
