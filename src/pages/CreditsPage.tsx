import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { toast } from "@/hooks/use-toast";
import { Loader2, Zap, TrendingUp, Star, Clock, ArrowRight } from "lucide-react";

const bundles = [
  { id: "starter", credits: 5, price: 5, label: "Starter" },
  { id: "basic", credits: 10, price: 10, label: "Basic" },
  { id: "standard", credits: 20, price: 20, label: "Standard", popular: true },
  { id: "pro", credits: 50, price: 50, label: "Pro" },
];

const CreditsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setBalance(data?.balance ?? 0));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Sign in to Buy Credits</h1>
          <Button onClick={() => navigate("/login")} className="h-9">Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const getPaymentErrorMessage = (message?: string) => {
    if (!message) return "Payment failed. Please try again.";
    if (message.toLowerCase().includes("payhero credentials not configured")) {
      return "Payment is temporarily unavailable while gateway credentials are being finalized.";
    }
    return message;
  };

  const handlePurchase = async () => {
    const bundle = bundles.find((b) => b.id === selectedBundle);
    if (!bundle || !mpesaPhone) return;
    setLoading(true);
    try {
      const result = await initiatePayment({ phone: mpesaPhone, amount: bundle.price, package_type: "credits", user_id: user.id });
      toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to complete payment" });
      const interval = setInterval(async () => {
        const status = await verifyPayment(result.transaction_id);
        if (status.status === "completed") { clearInterval(interval); setLoading(false); toast({ title: `${bundle.credits} credits added!` }); }
        else if (status.status === "failed") { clearInterval(interval); setLoading(false); toast({ title: "Payment failed", variant: "destructive" }); }
      }, 3000);
      setTimeout(() => { clearInterval(interval); setLoading(false); }, 120000);
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Payment error", description: getPaymentErrorMessage(err?.message), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Credit Bundles</h1>
            <p className="text-muted-foreground text-sm">Purchase credits to boost your ads and get more visibility.</p>
          </div>

          {/* Current balance */}
          {balance !== null && (
            <div className="flex items-center justify-between bg-card border border-border/60 rounded-xl p-4 mb-8">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Balance</p>
                <p className="text-3xl font-bold text-primary">{balance} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <div className="flex items-start gap-3 bg-card border border-border/60 rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Lower Boost Costs</p>
                <p className="text-xs text-muted-foreground mt-0.5">Apply credits to reduce the M-Pesa payment when upgrading ads to Silver or Gold tier.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-card border border-border/60 rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Priority Placement</p>
                <p className="text-xs text-muted-foreground mt-0.5">Boosted ads appear at the top of search results and on the homepage for maximum exposure.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-card border border-border/60 rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Up to 5x More Views</p>
                <p className="text-xs text-muted-foreground mt-0.5">Gold tier ads receive significantly more visibility and sell faster than standard listings.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-card border border-border/60 rounded-xl p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Trusted Badges</p>
                <p className="text-xs text-muted-foreground mt-0.5">Silver and Gold badges build credibility and trust with potential buyers browsing your ads.</p>
              </div>
            </div>
          </div>

          {/* Bundle cards */}
          <h2 className="font-heading font-semibold text-lg text-foreground mb-4">Choose a Bundle</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {bundles.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBundle(b.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedBundle === b.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card hover:border-primary/30"
                }`}
              >
                {b.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full uppercase whitespace-nowrap">
                    Popular
                  </span>
                )}
                <p className="text-xs font-medium text-muted-foreground mb-1">{b.label}</p>
                <p className="text-2xl font-bold text-foreground">{b.credits}</p>
                <p className="text-[11px] text-muted-foreground">credits</p>
                <div className="mt-3 pt-3 border-t border-border/40">
                  <p className="text-sm font-semibold text-primary">KSh {b.price}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Payment form */}
          {selectedBundle && (
            <div className="bg-card rounded-xl border border-border/60 p-5">
              <h3 className="font-heading font-semibold text-base text-foreground mb-4">Complete Purchase</h3>
              <label className="text-xs font-medium text-muted-foreground block mb-2">M-Pesa Phone Number</label>
              <Input
                placeholder="0712345678"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="h-11 mb-4"
              />
              <Button
                onClick={handlePurchase}
                className="w-full h-11"
                disabled={loading || !mpesaPhone}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <>Buy {bundles.find(b => b.id === selectedBundle)?.credits} Credits <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreditsPage;
