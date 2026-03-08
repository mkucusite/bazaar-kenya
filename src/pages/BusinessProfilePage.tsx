import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const BusinessProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setBusinessName(data.business_name || "");
        setDescription(data.description || "");
        setLocation(data.location || "");
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp || "");
        setWebsite(data.website || "");
      }
      setLoading(false);
    };
    fetch();
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  const handleCreate = async () => {
    if (!businessName.trim()) {
      toast({ title: "Business name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.from("business_profiles").insert({
      user_id: user.id,
      business_name: businessName.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      website: website.trim() || null,
    }).select().single();

    if (error) {
      toast({ title: "Failed to create profile", description: error.message, variant: "destructive" });
    } else {
      setProfile(data);
      toast({ title: "Business profile created!" });
    }
    setCreating(false);
  };

  const handleSave = async () => {
    if (!profile || !businessName.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("business_profiles").update({
      business_name: businessName.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      website: website.trim() || null,
    }).eq("id", profile.id).select().single();

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setProfile(data);
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-xl text-foreground mb-6">Business Profile</h1>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : !profile ? (
            <div className="bg-card rounded-xl border border-border/60 p-6 space-y-4">
              <div className="text-center mb-4">
                <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Create your business profile to build trust with buyers</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Business Name *</label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your Business Name" className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell buyers about your business..." className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
                <Button onClick={handleCreate} disabled={creating} className="w-full h-10">
                  {creating ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Creating...</> : "Create Business Profile"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/60 p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Business Name *</label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-10" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-20 px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Location</label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">WhatsApp</label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-10" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Website</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="h-10" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full h-10">
                  {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BusinessProfilePage;
