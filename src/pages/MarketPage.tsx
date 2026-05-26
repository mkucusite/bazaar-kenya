import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, Loader2, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";

type Profile = { id: string; full_name: string | null; avatar_url: string | null };

const MarketPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [marketName, setMarketName] = useState<string>("");
  const [ads, setAds] = useState<DbAd[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [customCats, setCustomCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [newCatInput, setNewCatInput] = useState("");

  const isOwner = !!user && user.id === userId;
  const customCatKey = `market_custom_cats_${userId}`;

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [{ data: prof }, { data: biz }, { data: cats }, { data: adsData }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").eq("id", userId).maybeSingle(),
        supabase.from("business_profiles").select("business_name").eq("user_id", userId).maybeSingle(),
        supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
        supabase
          .from("ads")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(500),
      ]);
      setProfile(prof as Profile | null);
      const defaultName = (biz as any)?.business_name || (prof as any)?.full_name ? `${(prof as any)?.full_name}'s Market` : "My Market";
      setMarketName((biz as any)?.business_name || defaultName);
      setCategories((cats as any) || []);
      setAds((adsData as any) || []);
      try {
        const raw = localStorage.getItem(customCatKey);
        if (raw) setCustomCats(JSON.parse(raw));
      } catch {}
      setLoading(false);

      // First-time prompt for owner
      if (user && user.id === userId && !(biz as any)?.business_name) {
        setNameInput(defaultName);
        setEditOpen(true);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user]);

  const adsByCategory = useMemo(() => {
    const map = new Map<string, DbAd[]>();
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    ads.forEach((ad) => {
      const name = (ad.category_id && byId.get(ad.category_id)) || "Other";
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(ad);
    });
    customCats.forEach((c) => { if (!map.has(c)) map.set(c, []); });
    return map;
  }, [ads, categories, customCats]);

  const tabs = Array.from(adsByCategory.keys());

  const saveName = async () => {
    if (!user || !isOwner) return;
    const name = nameInput.trim();
    if (!name) { toast.error("Market name required"); return; }
    const { data: existing } = await supabase.from("business_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      await supabase.from("business_profiles").update({ business_name: name } as any).eq("user_id", user.id);
    } else {
      await supabase.from("business_profiles").insert({ user_id: user.id, business_name: name } as any);
    }
    setMarketName(name);
    setEditOpen(false);
    toast.success("Market name saved");
  };

  const addCustomCat = () => {
    const c = newCatInput.trim();
    if (!c) return;
    const next = Array.from(new Set([...customCats, c]));
    setCustomCats(next);
    try { localStorage.setItem(customCatKey, JSON.stringify(next)); } catch {}
    setNewCatInput("");
  };

  const seoTitle = `${marketName} — My Market on KenyaAdvert`;
  const seoDesc = `Shop ${marketName}. Browse listings by category on KenyaAdvert.`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        canonical={`https://www.kenyaadverts.com/market/${userId}`}
        robots={!loading && ads.length === 0 ? "noindex, follow" : undefined}
      />
      <Navbar />
      <main className="container-app py-6 md:py-10">
        {/* Storefront header */}
        <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Store className="h-8 w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-4xl font-heading font-bold text-foreground truncate">{marketName}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {ads.length} {ads.length === 1 ? "listing" : "listings"} · Hosted on KenyaAdvert
                </p>
              </div>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => { setNameInput(marketName); setEditOpen(true); }}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit market
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : ads.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">No listings yet.</p>
            {isOwner && <Button asChild className="mt-4"><a href="/post-ad"><Plus className="h-4 w-4 mr-1" /> Post your first ad</a></Button>}
          </div>
        ) : (
          <Tabs defaultValue={tabs[0]} className="w-full">
            <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1">
              {tabs.map((t) => (
                <TabsTrigger key={t} value={t} className="text-xs md:text-sm">
                  {t} <span className="ml-1.5 text-[10px] opacity-70">({adsByCategory.get(t)?.length || 0})</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((t) => (
              <TabsContent key={t} value={t} className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {(adsByCategory.get(t) || []).map((ad) => (
                    <AdCard key={ad.id} ad={mapDbAdToCard(ad)} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {isOwner && (
          <div className="mt-8 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-2">Add a custom category</p>
            <div className="flex gap-2">
              <Input placeholder="e.g. Vintage Items" value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)} />
              <Button onClick={addCustomCat} size="sm">Add</Button>
            </div>
            {customCats.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">Custom: {customCats.join(", ")}</p>
            )}
          </div>
        )}
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Name your market</DialogTitle></DialogHeader>
          <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="e.g. Asha's Kitchenware" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MarketPage;
