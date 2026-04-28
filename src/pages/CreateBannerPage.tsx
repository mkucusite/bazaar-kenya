import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ImagePlus, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "politician", label: "Politician / Voting" },
  { key: "business", label: "Business" },
  { key: "event", label: "Event" },
  { key: "ngo", label: "NGO / Cause" },
  { key: "other", label: "Other" },
];

const CreateBannerPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    business_name: "",
    description: "",
    target_url: "",
    category: "business",
    is_voting_enabled: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in");
      navigate("/login?redirect=/banners/new");
    }
  }, [user, authLoading, navigate]);

  const handleImg = (file: File | null) => {
    setImgFile(file);
    setImgPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.business_name.trim() || !form.target_url.trim() || !imgFile) {
      toast.error("Name, link and image are required");
      return;
    }
    setSubmitting(true);
    try {
      const ext = imgFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("banners").upload(path, imgFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);

      const { data, error } = await supabase
        .from("banner_campaigns" as any)
        .insert({
          user_id: user.id,
          business_name: form.business_name.trim(),
          description: form.description.trim() || null,
          target_url: form.target_url.trim(),
          category: form.category,
          is_voting_enabled: form.is_voting_enabled,
          banner_image: pub.publicUrl,
          position: "showcase",
          status: "active",
          package_type: "self_serve",
          amount_paid: 0,
        } as any)
        .select("slug,id")
        .single();
      if (error) throw error;

      toast.success("Banner published!");
      navigate(`/banners/${(data as any).slug || (data as any).id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const isPolitician = form.category === "politician";
  // Auto-enable voting for politicians
  useEffect(() => {
    if (isPolitician && !form.is_voting_enabled) {
      setForm(f => ({ ...f, is_voting_enabled: true }));
    }
  }, [isPolitician]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Create a Banner | KenyaAdvert" description="Promote your business, event, or political campaign with a shareable banner page on KenyaAdvert." canonical="https://www.kenyaadverts.co.ke/banners/new" />
      <Navbar />
      <main className="container-app max-w-2xl py-6 md:py-10">
        <h1 className="mb-1 text-3xl font-bold flex items-center gap-2"><Megaphone className="h-7 w-7 text-primary" />Create Banner</h1>
        <p className="mb-6 text-sm text-muted-foreground">Pick a category — we'll style your banner page accordingly. Politicians get a vote-enabled poster look, businesses & NGOs get a clean wide layout.</p>

        <form onSubmit={onSubmit} className="space-y-5">
          <Card className="space-y-4 p-4">
            <div>
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {isPolitician
                  ? "Recommended image: 4:5 portrait poster (e.g. 1080×1350)"
                  : "Recommended image: 3:1 wide banner (e.g. 1200×400)"}
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <label className={`relative block w-full cursor-pointer overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 ${isPolitician ? "aspect-[4/5]" : "aspect-[3/1]"}`}>
              {imgPreview ? (
                <img src={imgPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/60">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">
                    {isPolitician ? "Add poster (4:5 portrait)" : "Add banner image (3:1 wide)"}
                  </span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleImg(e.target.files?.[0] || null)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
          </Card>

          <Card className="space-y-4 p-4">
            <div>
              <Label>{isPolitician ? "Candidate / Campaign name" : "Banner / Business name"}</Label>
              <Input
                placeholder={isPolitician ? "e.g. Vote John Doe — MP Westlands" : "e.g. Acme Roofing"}
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                placeholder={isPolitician ? "Your manifesto, slogan, or message to voters" : "Tell visitors more about your campaign or offer"}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Target link (where banner clicks go)</Label>
              <Input type="url" placeholder="https://yoursite.com" value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} required />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Enable voting</Label>
                <p className="text-xs text-muted-foreground">{isPolitician ? "Recommended for political campaigns. " : ""}Each visitor can vote once.</p>
              </div>
              <Switch checked={form.is_voting_enabled} onCheckedChange={(v) => setForm({ ...form, is_voting_enabled: v })} />
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</> : "Publish Banner"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateBannerPage;
