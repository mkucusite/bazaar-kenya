import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Edit, Trash2, Crown, Star, Loader2, Plus, Share2, ExternalLink, MapPin, Clock, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const MyAdsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAds = async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setAds(data || []);
      setLoading(false);
    };
    fetchAds();
  }, [user]);

  if (!user) {
    navigate("/login");
    return null;
  }

  const deleteAd = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (!error) {
      setAds(ads.filter((a) => a.id !== id));
      if (selectedAd?.id === id) setSelectedAd(null);
      toast({ title: "Ad deleted" });
    }
  };

  const shareAd = async (ad: any) => {
    const url = `${window.location.origin}/ads/${ad.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: ad.title, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    expired: "bg-muted text-muted-foreground",
    pending: "bg-amber-500/10 text-amber-600",
  };

  const badgeStyles: Record<string, string> = {
    gold: "bg-gradient-to-r from-gold to-amber-400 text-foreground",
    silver: "bg-gradient-to-r from-silver to-slate-300 text-foreground",
    standard: "bg-muted text-muted-foreground",
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">My Ads</h1>
              <p className="text-sm text-muted-foreground">{ads.length} listing{ads.length !== 1 ? "s" : ""}</p>
            </div>
            <Button onClick={() => navigate("/post-ad")} className="h-10">
              <Plus className="w-4 h-4 mr-1.5" /> Post Ad
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No ads yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Start selling by posting your first ad</p>
              <Button onClick={() => navigate("/post-ad")} className="h-11">Post Your First Ad</Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Ad List */}
              <div className="lg:col-span-2 space-y-3">
                {ads.map((ad) => (
                  <button
                    key={ad.id}
                    onClick={() => setSelectedAd(ad)}
                    className={`w-full text-left bg-card rounded-xl border p-3 transition-all ${
                      selectedAd?.id === ad.id ? "border-primary ring-1 ring-primary/20" : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {ad.images?.[0] && (
                          <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm text-foreground line-clamp-1">{ad.title}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase flex-shrink-0 ${badgeStyles[ad.badge] || badgeStyles.standard}`}>
                            {ad.badge}
                          </span>
                        </div>
                        <p className="text-primary font-bold text-sm mt-0.5">
                          {Number(ad.price) > 0 ? `KSh ${Number(ad.price).toLocaleString()}` : "Contact"}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {ad.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {ad.contacts_count || 0}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColors[ad.status] || statusColors.active}`}>
                            {ad.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Ad Preview Panel */}
              <div className="lg:col-span-3">
                {selectedAd ? (
                  <div className="bg-card rounded-2xl border border-border/60 overflow-hidden sticky top-20">
                    {/* Preview Image */}
                    {selectedAd.images?.[0] && (
                      <div className="aspect-video bg-muted relative">
                        <img src={selectedAd.images[0]} alt="" className="w-full h-full object-cover" />
                        {selectedAd.badge !== "standard" && (
                          <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold uppercase ${
                            selectedAd.badge === "gold" ? "bg-gold text-foreground" : "bg-silver text-foreground"
                          }`}>
                            {selectedAd.badge === "gold" && <Crown className="w-3 h-3 inline mr-1" />}
                            {selectedAd.badge === "silver" && <Star className="w-3 h-3 inline mr-1" />}
                            {selectedAd.badge}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Preview Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="font-heading font-bold text-lg text-foreground leading-tight">{selectedAd.title}</h2>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${statusColors[selectedAd.status] || statusColors.active}`}>
                          {selectedAd.status}
                        </span>
                      </div>

                      <p className="text-2xl font-bold text-primary mb-4">
                        {Number(selectedAd.price) > 0 ? `KSh ${Number(selectedAd.price).toLocaleString()}` : "Contact for Price"}
                        {selectedAd.is_negotiable && <span className="text-sm font-normal text-muted-foreground ml-2">Negotiable</span>}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                        {selectedAd.county && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {selectedAd.town ? `${selectedAd.town}, ${selectedAd.county}` : selectedAd.county}
                          </span>
                        )}
                        {selectedAd.condition && (
                          <span className="px-2 py-0.5 bg-muted rounded text-xs">{selectedAd.condition}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(selectedAd.created_at)}
                        </span>
                      </div>

                      {/* Description */}
                      {selectedAd.description && (
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{selectedAd.description}</p>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                          <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{selectedAd.views_count || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Views</p>
                        </div>
                        <div className="bg-muted/50 rounded-xl p-3 text-center">
                          <MessageCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-lg font-bold text-foreground">{selectedAd.contacts_count || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Contacts</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="h-10" asChild>
                          <Link to={`/ads/${selectedAd.id}`}>
                            <ExternalLink className="w-4 h-4 mr-1.5" /> View Live
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="h-10" onClick={() => shareAd(selectedAd)}>
                          <Share2 className="w-4 h-4 mr-1.5" /> Share
                        </Button>
                        <Button variant="outline" size="sm" className="h-10">
                          <Edit className="w-4 h-4 mr-1.5" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-10 text-destructive hover:bg-destructive/10" onClick={() => deleteAd(selectedAd.id)}>
                          <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                        </Button>
                      </div>

                      {/* Upgrade CTA */}
                      {selectedAd.badge === "standard" && (
                        <div className="mt-5 p-4 bg-gradient-to-r from-gold/10 to-amber-500/10 rounded-xl border border-gold/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="w-5 h-5 text-gold" />
                            <span className="font-heading font-semibold text-sm text-foreground">Boost this ad</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">Get 6x more views with a Gold listing</p>
                          <Button size="sm" className="h-9 bg-gold hover:bg-gold/90 text-foreground">Upgrade to Gold</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border/60 p-10 text-center hidden lg:block">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Eye className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">Ad Preview</h3>
                    <p className="text-muted-foreground text-sm">Select an ad to see its details</p>
                  </div>
                )}

                {/* Mobile: Show selected ad inline */}
                {selectedAd && (
                  <div className="lg:hidden mt-4">
                    <Button variant="outline" onClick={() => setSelectedAd(null)} className="w-full h-10 mb-4">
                      Close Preview
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyAdsPage;
