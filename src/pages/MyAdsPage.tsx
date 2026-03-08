import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Edit, Trash2, Crown, Star, Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MyAdsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAds = async () => {
      const { data } = await supabase.from("ads").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setAds(data || []);
      setLoading(false);
    };
    fetchAds();
  }, [user]);

  if (!user) { navigate("/login"); return null; }

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (!error) { setAds(ads.filter((a) => a.id !== id)); toast({ title: "Ad deleted" }); }
  };

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    expired: "bg-muted text-muted-foreground",
    pending: "bg-accent/10 text-accent-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading font-bold text-xl text-foreground">My Ads</h1>
            <Button onClick={() => navigate("/post-ad")} className="h-9 text-sm"><Plus className="w-4 h-4 mr-1" /> Post New Ad</Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : ads.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border/60">
              <p className="text-muted-foreground text-sm mb-4">You haven't posted any ads yet</p>
              <Button onClick={() => navigate("/post-ad")} className="h-9 text-sm">Post Your First Ad</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ads.map((ad) => (
                <div key={ad.id} className="bg-card rounded-xl border border-border/60 p-4 flex gap-4">
                  <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {ad.images?.[0] && <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-foreground truncate">{ad.title}</h3>
                        <p className="text-primary font-bold text-sm">KSh {Number(ad.price).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${statusColors[ad.status] || statusColors.active}`}>
                        {ad.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ad.views_count || 0}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ad.contacts_count || 0}</span>
                      {ad.badge && ad.badge !== "standard" && (
                        <span className="flex items-center gap-1">
                          {ad.badge === "gold" ? <Crown className="w-3 h-3 text-gold" /> : <Star className="w-3 h-3 text-silver" />}
                          {ad.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2"><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 text-destructive" onClick={() => deleteAd(ad.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAdsPage;
