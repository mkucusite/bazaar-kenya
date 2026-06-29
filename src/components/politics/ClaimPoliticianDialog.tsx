import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Loader2, Phone, CheckCircle2, XCircle, Lock, Pencil, Images, Megaphone, Sparkles, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { initiatePayment, verifyPayment } from "@/lib/payments";

interface Props {
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
  onClaimed?: () => void;
}

const CLAIM_PRICE = 1500;

type PayState = "idle" | "paying" | "polling" | "success" | "failed";

const ClaimPoliticianDialog = ({ open, onOpenChange, politician, onClaimed }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [payState, setPayState] = useState<PayState>("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearPoll = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };

  useEffect(() => () => clearPoll(), []);
  useEffect(() => {
    if (!open) { clearPoll(); setPayState("idle"); return; }
    if (!user) return;
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.phone) setPhone(data.phone); });
  }, [open, user]);

  const handleClaim = async () => {
    if (!politician) return;
    if (!user) {
      onOpenChange(false);
      navigate(`/login?redirect=${encodeURIComponent(`/politicians/${politician.slug}?action=claim`)}`);
      return;
    }
    if (!phone || phone.trim().length < 9) { toast.error("Enter a valid M-Pesa phone number"); return; }

    setPayState("paying");
    try {
      const profileUrl = `https://www.kenyaadverts.com/politicians/${politician.slug}`;
      const { data: created, error } = await supabase
        .from("banner_campaigns" as any)
        .insert({
          user_id: user.id,
          business_name: politician.name,
          description: politician.bio || `Verified profile claim for ${politician.name}.`,
          target_url: profileUrl,
          category: "politician_claim",
          banner_image: politician.photo || politician.cover || "/og-image.png",
          gallery_images: [politician.photo || politician.cover || "/og-image.png"],
          position: "profile_claim",
          status: "pending_payment",
          is_listed: false,
          package_type: "politician_profile_claim",
          country: "Kenya",
          county: politician.county || politician.region || null,
          running_position: politician.position || null,
          party_name: politician.party_name || null,
          slogan: politician.tagline || null,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      const bannerId = (created as any).id;

      const result = await initiatePayment({
        phone: phone.trim(), amount: CLAIM_PRICE,
        package_type: "politician_profile_claim",
        banner_id: bannerId, user_id: user.id,
      });
      if (!result?.success) throw new Error(result?.error || "Payment failed");
      await supabase.from("banner_campaigns" as any).update({ payment_id: result.payment_id } as any).eq("id", bannerId);
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
            toast.success("Profile claimed! Manage it from My Campaigns.");
            setTimeout(() => { onClaimed?.(); onOpenChange(false); navigate("/my-campaigns"); }, 1500);
          } else if (v?.status === "failed" || attempts >= 30) {
            clearPoll(); setPayState("failed"); toast.error("Payment was not completed.");
          }
        } catch { if (attempts >= 30) { clearPoll(); setPayState("failed"); } }
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
            <BadgeCheck className="w-5 h-5 text-primary" /> Claim {politician?.name}'s profile
          </SheetTitle>
          <SheetDescription className="text-sm">
            A one-time fee of <span className="font-semibold text-foreground">KSh {CLAIM_PRICE.toLocaleString()}</span> verifies your ownership and unlocks full editing.
          </SheetDescription>
        </SheetHeader>

        <ul className="mt-4 space-y-2 text-sm text-foreground/90">
          <li className="flex gap-2"><Pencil className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Edit name, bio, photo, education, manifesto and contact details.</li>
          <li className="flex gap-2"><BadgeCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Earn a green "Claimed" badge that voters trust.</li>
          <li className="flex gap-2"><Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Page is bound to your signed-in email — only you can publish changes.</li>
        </ul>

        <div className="mt-5">
          <label className="text-sm font-medium text-foreground mb-1.5 block">M-Pesa Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" className="pl-10 h-12" disabled={isProcessing} />
          </div>
        </div>

        {payState === "polling" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <p className="text-sm">Waiting for M-Pesa confirmation…</p>
          </div>
        )}
        {payState === "success" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Claim confirmed! Redirecting to My Campaigns…</p>
          </div>
        )}
        {payState === "failed" && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">Payment was not completed. Try again.</p>
          </div>
        )}

        <Button onClick={handleClaim} disabled={isProcessing || payState === "success"} className="w-full h-12 mt-5 text-base font-semibold" size="lg">
          {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />{payState === "polling" ? "Waiting…" : "Processing…"}</>) : (<><BadgeCheck className="w-4 h-4 mr-2" />Pay KSh {CLAIM_PRICE.toLocaleString()} & claim profile</>)}
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground text-center">
          After payment, this profile is linked to your KenyaAdverts account and appears under "My Campaigns" where you can edit and publish changes.
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default ClaimPoliticianDialog;
