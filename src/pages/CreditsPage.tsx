import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Coins, Sparkles } from "lucide-react";

const bundles = [
  { id: "starter", credits: 5, price: 5, label: "Starter", popular: false },
  { id: "basic", credits: 10, price: 10, label: "Basic", popular: false },
  { id: "standard", credits: 20, price: 20, label: "Standard", popular: true },
  { id: "pro", credits: 50, price: 50, label: "Pro", popular: false },
];

const CreditsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [loading, setLoading] = useState(false);

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
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-xl text-foreground mb-1">Credit Bundles</h1>
          <p className="text-muted-foreground text-xs mb-6">Credits help you boost your ads to Silver or Gold tier for more visibility and faster sales.</p>

          {/* Why buy credits */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-2">Why buy credits?</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>✅ <strong>Reduce boost costs</strong> — Apply credits to lower the M-Pesa payment for Silver & Gold upgrades</li>
              <li>✅ <strong>Priority placement</strong> — Boosted ads appear at the top of search results and homepage</li>
              <li>✅ <strong>More views, faster sales</strong> — Gold ads get up to 5x more visibility than standard listings</li>
              <li>✅ <strong>Stand out with badges</strong> — Silver and Gold badges build trust with buyers</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {bundles.map((b) => (
              <button key={b.id} onClick={() => setSelectedBundle(b.id)} className={`p-5 rounded-xl border-2 text-left transition-all relative ${selectedBundle === b.id ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:border-border"}`}>
                {b.popular && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded uppercase flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Popular
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-heading font-bold text-sm text-foreground">{b.label}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{b.credits} <span className="text-xs font-normal text-muted-foreground">credits</span></p>
                <p className="text-xs text-muted-foreground mt-1">KSh {b.price}</p>
              </button>
            ))}
          </div>

          {selectedBundle && (
            <div className="bg-card rounded-xl border border-border/60 p-5 mb-6">
              <label className="text-xs font-semibold text-foreground block mb-2">M-Pesa Phone Number</label>
              <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="h-10" />
              <Button onClick={handlePurchase} className="w-full mt-3 h-10" disabled={loading || !mpesaPhone}>
                {loading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Processing...</> : `Buy ${bundles.find(b => b.id === selectedBundle)?.credits} Credits`}
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
