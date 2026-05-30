import { useEffect, useMemo, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CreditCard, Crown, Loader2, Receipt, Sparkles, Wallet } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";

type SubscriptionEntry = {
  id: string;
  type: "credits" | "boost";
  title: string;
  amount: number;
  status: string;
  created_at: string;
};

const SubscriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [entries, setEntries] = useState<SubscriptionEntry[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);

      const [creditsRes, purchasesRes, paymentsRes] = await Promise.all([
        supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("credit_purchases")
          .select("id, credits_amount, price, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, amount, package_type, payment_status, created_at")
          .eq("user_id", user.id)
          .in("package_type", ["silver", "gold"]) 
          .order("created_at", { ascending: false }),
      ]);

      setCreditsBalance(Number(creditsRes.data?.balance || 0));

      const creditEntries: SubscriptionEntry[] = (purchasesRes.data || []).map((purchase) => ({
        id: purchase.id,
        type: "credits",
        title: `${purchase.credits_amount} credits package`,
        amount: Number(purchase.price || 0),
        status: "completed",
        created_at: purchase.created_at || new Date().toISOString(),
      }));

      const boostEntries: SubscriptionEntry[] = (paymentsRes.data || []).map((payment) => ({
        id: payment.id,
        type: "boost",
        title: `${String(payment.package_type || "boost").toUpperCase()} listing boost`,
        amount: Number(payment.amount || 0),
        status: payment.payment_status || "pending",
        created_at: payment.created_at || new Date().toISOString(),
      }));

      const merged = [...creditEntries, ...boostEntries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setEntries(merged);
      setLoading(false);
    };

    loadData();
  }, [user, navigate]);

  const totalSpent = useMemo(
    () => entries.filter((item) => item.status === "completed").reduce((sum, item) => sum + item.amount, 0),
    [entries]
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Subscription History — Your Transactions" description="View your subscription history, credit purchases, and ad boost transactions on KenyaAdvert." canonical="https://www.kenyaadverts.com/credits" robots="noindex, follow" ogImage="https://www.kenyaadverts.com/og/og-subscriptions.png" keywords="subscription history KenyaAdvert, transactions Kenya, KenyaAdvert account, credit purchases, ad boost history, M-Pesa transactions, payment history classifieds, manage subscriptions Kenya" />
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border/60 p-6 mb-6">
            <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Subscription & Credits</h1>
            <p className="text-sm text-muted-foreground mb-5">Track your credit purchases and listing boosts in one place.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Current Credits</p>
                <p className="text-2xl font-bold text-foreground">{creditsBalance}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold text-foreground">{entries.length}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">KSh {totalSpent.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Boost Purchases</p>
                <p className="text-2xl font-bold text-foreground">{entries.filter((item) => item.type === "boost").length}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="font-heading font-semibold text-xl text-foreground mb-2">No subscription history yet</h2>
              <p className="text-muted-foreground text-sm mb-6">Your credit purchases and boost payments will appear here.</p>
              <Button onClick={() => navigate("/credits")} className="h-10">
                <Sparkles className="w-4 h-4 mr-1.5" /> Buy Credits
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60">
                <h2 className="font-heading font-semibold text-base text-foreground">Transaction History</h2>
              </div>

              <div className="divide-y divide-border/60">
                {entries.map((entry) => {
                  const isCompleted = entry.status === "completed";

                  return (
                    <div key={entry.id} className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {entry.type === "credits" ? (
                            <CreditCard className="w-5 h-5 text-primary" />
                          ) : (
                            <Crown className="w-5 h-5 text-gold" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.created_at).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">KSh {entry.amount.toLocaleString()}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            isCompleted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Receipt className="w-3 h-3" /> {entry.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="container-app py-8 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-heading mb-3">Related Listings & Deals</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {['Electronics','Vehicles','Property Rentals & Sales','Jobs','Services'].map((c) => (
            <Link key={c} to={`/search?category=${encodeURIComponent(c)}`} className="px-3 py-1 rounded-full bg-card text-sm hover:bg-primary/5">{c}</Link>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PREMIUM_ADS.slice(0,6).map((a) => (
          <Link key={a.id} to={getAdPath({ id: a.id, title: a.title, slug: a.slug })} className="block p-3 bg-card rounded-lg hover:shadow-sm">
                <div className="font-medium text-sm truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.location} · KSh {a.price.toLocaleString()}</div>
          </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SubscriptionsPage;
