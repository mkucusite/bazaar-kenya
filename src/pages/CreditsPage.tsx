import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Coins } from "lucide-react";

const bundles = [
  { id: "starter", credits: 5, price: 5, label: "Starter" },
  { id: "basic", credits: 10, price: 10, label: "Basic" },
  { id: "standard", credits: 20, price: 20, label: "Standard" },
  { id: "pro", credits: 50, price: 50, label: "Pro" },
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
        <div className="section-padding py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Sign in to Buy Credits</h1>
          <Button onClick={() => navigate("/login")}>Sign In</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePurchase = async () => {
    const bundle = bundles.find((b) => b.id === selectedBundle);
    if (!bundle || !mpesaPhone) return;

    setLoading(true);
    try {
      const result = await initiatePayment({
        phone: mpesaPhone,
        amount: bundle.price,
        package_type: "credits",
        user_id: user.id,
      });
      toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to complete payment" });

      const interval = setInterval(async () => {
        const status = await verifyPayment(result.transaction_id);
        if (status.status === "completed") {
          clearInterval(interval);
          setLoading(false);
          toast({ title: `${bundle.credits} credits added!` });
        } else if (status.status === "failed") {
          clearInterval(interval);
          setLoading(false);
          toast({ title: "Payment failed", variant: "destructive" });
        }
      }, 3000);

      setTimeout(() => { clearInterval(interval); setLoading(false); }, 120000);
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Credit Bundles</h1>
          <p className="text-muted-foreground text-sm mb-8">Each ad post costs 1 credit. Buy credits to post ads on KenyaAdvert.</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {bundles.map((b) => (
              <button key={b.id} onClick={() => setSelectedBundle(b.id)} className={`p-5 rounded-xl border-2 text-left transition-colors ${selectedBundle === b.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-heading font-bold text-foreground">{b.label}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{b.credits} <span className="text-sm font-normal text-muted-foreground">credits</span></p>
                <p className="text-sm text-muted-foreground mt-1">KSh {b.price}</p>
              </button>
            ))}
          </div>

          {selectedBundle && (
            <div className="bg-card rounded-xl border border-border p-5 mb-6">
              <label className="text-sm font-medium text-foreground block mb-2">M-Pesa Phone Number</label>
              <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
              <Button onClick={handlePurchase} className="w-full mt-4" disabled={loading || !mpesaPhone}>
                {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : `Buy ${bundles.find(b => b.id === selectedBundle)?.credits} Credits`}
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
