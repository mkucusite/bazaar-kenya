import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

const FavouritesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("favourites").select("*, ads(*)").eq("user_id", user.id);
      setFavourites(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user) { navigate("/login"); return null; }

  const removeFav = async (id: string) => {
    await supabase.from("favourites").delete().eq("id", id);
    setFavourites(favourites.filter((f) => f.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <h1 className="font-heading font-bold text-2xl text-foreground mb-6">My Favourites</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : favourites.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">You haven't saved any ads yet</p>
            <Button onClick={() => navigate("/")}>Browse Ads</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {favourites.map((fav) => fav.ads && (
              <div key={fav.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <img src={fav.ads.images?.[0] || "/placeholder.svg"} alt="" className="w-full aspect-[4/3] object-cover" />
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-foreground truncate">{fav.ads.title}</h3>
                  <p className="text-primary font-bold text-sm">KSh {Number(fav.ads.price).toLocaleString()}</p>
                  <Button variant="outline" size="sm" className="w-full mt-2 text-xs text-destructive" onClick={() => removeFav(fav.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default FavouritesPage;
