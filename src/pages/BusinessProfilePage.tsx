import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdCard from "@/components/AdCard";
import {
  Building2,
  Loader2,
  Save,
  Phone,
  MessageCircle,
  Share2,
  MapPin,
  Globe,
  Calendar,
  ShieldCheck,
  Star,
  Edit,
  FileText,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAdPath } from "@/lib/ad-links";
import { mapDbAdToCard } from "@/lib/ad-mappers";
import type { Tables } from "@/integrations/supabase/types";

type BusinessProfile = Tables<"business_profiles">;
type AdRecord = Tables<"ads">;

/* ─── Public Profile View ───────────────────────────────────── */
const ProfileView = ({
  profile,
  ads,
  isOwner,
  onEdit,
}: {
  profile: BusinessProfile;
  ads: AdRecord[];
  isOwner: boolean;
  onEdit: () => void;
}) => {
  const navigate = useNavigate();
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-KE", { month: "long", year: "numeric" })
    : "";

  const handleShare = () => {
    const url = `${window.location.origin}/business-profile?id=${profile.id}`;
    if (navigator.share) {
      navigator.share({ title: profile.business_name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <div>
      {/* Header card */}
      <div className="bg-card border border-border/60 rounded-xl overflow-hidden mb-6">
        {/* Cover area */}
        <div className="h-28 sm:h-36 bg-gradient-to-br from-primary/20 to-primary/5" />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-xl bg-primary/10 border-4 border-card flex items-center justify-center">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-foreground truncate">
                  {profile.business_name}
                </h1>
                {profile.is_verified && (
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                )}
              </div>
              {profile.location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {profile.location}
                </p>
              )}
            </div>
          </div>

          {profile.description && (
            <p className="text-sm text-muted-foreground mb-4">{profile.description}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {ads.length} ad{ads.length !== 1 ? "s" : ""}
            </span>
            {memberSince && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Member since {memberSince}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {profile.phone && (
              <a href={`tel:${profile.phone}`}>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Call
                </Button>
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/^0/, "254")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-green-600 border-green-200 hover:bg-green-50">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </Button>
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Website
                </Button>
              </a>
            )}
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleShare}>
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
            {isOwner && (
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onEdit}>
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ads grid */}
      <h2 className="font-heading font-semibold text-base text-foreground mb-3">
        Ads by {profile.business_name}
      </h2>
      {ads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No ads posted yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {ads.map((ad) => {
            const card = mapDbAdToCard(ad as any);
            return (
              <div key={ad.id} onClick={() => navigate(getAdPath({ id: ad.id, title: ad.title }))} className="cursor-pointer">
                <AdCard ad={card} />
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews section placeholder */}
      <div className="mt-8 bg-card border border-border/60 rounded-xl p-5">
        <h2 className="font-heading font-semibold text-base text-foreground mb-1">Reviews & Ratings</h2>
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-4 h-4 text-muted-foreground/30" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">No reviews yet</span>
        </div>
        <p className="text-xs text-muted-foreground">Reviews will appear here once customers leave feedback.</p>
      </div>
    </div>
  );
};

/* ─── Edit / Create Form ────────────────────────────────────── */
const ProfileForm = ({
  profile,
  onSaved,
  userId,
}: {
  profile: BusinessProfile | null;
  onSaved: (p: BusinessProfile) => void;
  userId: string;
}) => {
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState(profile?.business_name || "");
  const [description, setDescription] = useState(profile?.description || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [website, setWebsite] = useState(profile?.website || "");

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      toast({ title: "Business name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      business_name: businessName.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      website: website.trim() || null,
    };

    if (profile) {
      const { data, error } = await supabase
        .from("business_profiles")
        .update(payload)
        .eq("id", profile.id)
        .select()
        .single();
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        onSaved(data);
        toast({ title: "Profile updated!" });
      }
    } else {
      const { data, error } = await supabase
        .from("business_profiles")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
      if (error) {
        toast({ title: "Failed to create profile", description: error.message, variant: "destructive" });
      } else {
        onSaved(data);
        toast({ title: "Business profile created!" });
      }
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-card rounded-xl border border-border/60 p-6 space-y-4">
        {!profile && (
          <div className="text-center mb-2">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Create your business profile to build trust with buyers</p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Business Name *</label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your Business Name" className="h-10" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell buyers about your business..."
            className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Nairobi CBD" className="h-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" className="h-10" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">WhatsApp</label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0712345678" className="h-10" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Website</label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="h-10" />
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="w-full h-10">
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</>
          ) : profile ? (
            <><Save className="w-4 h-4 mr-1" /> Save Changes</>
          ) : (
            "Create Business Profile"
          )}
        </Button>
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────── */
const BusinessProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileIdParam = searchParams.get("id");

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [ads, setAds] = useState<AdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const isPublicView = !!profileIdParam;
  const isOwner = !!user && profile?.user_id === user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      let data: BusinessProfile | null = null;

      if (profileIdParam) {
        const res = await supabase.from("business_profiles").select("*").eq("id", profileIdParam).maybeSingle();
        data = res.data;
      } else if (user) {
        const res = await supabase.from("business_profiles").select("*").eq("user_id", user.id).maybeSingle();
        data = res.data;
      }

      if (data) {
        setProfile(data);
        const adsRes = await supabase
          .from("ads")
          .select("*")
          .eq("user_id", data.user_id)
          .eq("status", "active")
          .order("created_at", { ascending: false });
        setAds(adsRes.data || []);
      }
      setLoading(false);
    };

    if (!authLoading) fetchProfile();
  }, [user, authLoading, profileIdParam]);

  // Redirect to login if not public view and not logged in
  if (!authLoading && !user && !isPublicView) {
    navigate("/login");
    return null;
  }

  const handleSaved = async (saved: BusinessProfile) => {
    setProfile(saved);
    setEditing(false);
    // Fetch ads for the profile
    const adsRes = await supabase
      .from("ads")
      .select("*")
      .eq("user_id", saved.user_id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    setAds(adsRes.data || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading font-bold text-xl text-foreground mb-6">Business Profile</h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : profile && !editing ? (
            <ProfileView profile={profile} ads={ads} isOwner={isOwner} onEdit={() => setEditing(true)} />
          ) : (
            <ProfileForm profile={editing ? profile : null} onSaved={handleSaved} userId={user?.id || ""} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfilePage;
