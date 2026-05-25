import { useEffect, useRef, useState } from "react";
import { Rocket, Loader2, Phone, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { initiatePayment, verifyPayment } from "@/lib/payments";

interface BoostEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; title: string } | null;
  onBoosted?: () => void;
}

type PayState = "idle" | "paying" | "polling" | "success" | "failed";

const PRESETS = [500, 750, 1000];
const MAX_AMOUNT = 1000;

const BoostEventDialog = ({ open, onOpenChange, event, onBoosted }: BoostEventDialogProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(500);
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
    if (!event || !user) return;
    if (amount < 500) { toast.error("Minimum boost amount is KSh 500"); return; }
    if (amount > MAX_AMOUNT) { toast.error(`Maximum boost amount is KSh ${MAX_AMOUNT}`); return; }
    if (!phone || phone.trim().length < 9) { toast.error("Enter a valid M-Pesa phone number"); return; }

    setPayState("paying");
    try {
      const result = await initiatePayment({
        phone: phone.trim(),
        amount,
        package_type: "event_boost",
        event_id: event.id,
        user_id: user.id,
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
            toast.success("Event boosted for 30 days!");
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
            <Rocket className="w-5 h-5 text-primary" /> Boost Your Event
          </SheetTitle>
          <SheetDescription className="text-sm">
            Promote <span className="font-medium text-foreground">"{event?.title}"</span> for 30 days. Minimum KSh 500.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              disabled={isProcessing}
              className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
                amount === p ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              KSh {p.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Custom amount (KSh)</label>
          <Input
            type="number"
            min={500}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            disabled={isProcessing}
          />
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Higher amounts get higher placement.
          </p>
        </div>

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

        <Button onClick={handleBoost} disabled={isProcessing || amount < 500 || payState === "success"} className="w-full h-12 mt-5 text-base font-semibold" size="lg">
          {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />{payState === "polling" ? "Waiting…" : "Processing…"}</>) : (<><Rocket className="w-4 h-4 mr-2" />Pay KSh {amount.toLocaleString()} via M-Pesa</>)}
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default BoostEventDialog;
