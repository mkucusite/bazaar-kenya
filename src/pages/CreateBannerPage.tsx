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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ImagePlus, Loader2, Megaphone, X } from "lucide-react";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "politician", label: "Politician / Voting" },
  { key: "business", label: "Business" },
  { key: "ngo", label: "NGO / Cause" },
  { key: "other", label: "Other" },
];

const CreateBannerPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgPreviews, setImgPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    business_name: "",
    description: "",
    target_url: "",
    category: "business",
    is_voting_enabled: false,
    // politician-only
    running_position: "",
    party_name: "",
    party_color: "#1B5E20",
    candidate_number: "",
    slogan: "",
    manifesto_text: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in");
      navigate("/login?redirect=/banners/new");
    }
  }, [user, authLoading, navigate]);

  const handleImages = (files: FileList | null) => {
    const selected = Array.from(files || []).slice(0, 3);
    setImgFiles(selected);
    setImgPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index: number) => {
    setImgFiles((prev) => prev.filter((_, i) => i !== index));
    setImgPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.business_name.trim() || imgFiles.length === 0) {
      toast.error("Name and at least one image are required");
      return;
    }
    setSubmitting(true);
    try {
      const uploadedImages: string[] = [];
      for (const [index, file] of imgFiles.entries()) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${index}.${ext}`;
        const { error: upErr } = await supabase.storage.from("banners").upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
        uploadedImages.push(pub.publicUrl);
      }

      const { data, error } = await supabase
        .from("banner_campaigns" as any)
        .insert({
          user_id: user.id,
          business_name: form.business_name.trim(),
          description: form.description.trim() || null,
          target_url: form.target_url.trim() || `https://www.kenyaadverts.com/banners`,
          category: form.category,
          is_voting_enabled: form.is_voting_enabled,
          banner_image: uploadedImages[0],
          gallery_images: uploadedImages,
          position: "showcase",
          status: "active",
          package_type: "self_serve",
          amount_paid: 0,
          // politician fields (null if not politician)
          running_position: form.category === "politician" ? form.running_position.trim() || null : null,
          party_name: form.category === "politician" ? form.party_name.trim() || null : null,
          party_color: form.category === "politician" ? form.party_color || null : null,
          candidate_number: form.category === "politician" ? form.candidate_number.trim() || null : null,
          slogan: form.category === "politician" ? form.slogan.trim() || null : null,
          manifesto_points: form.category === "politician" && form.manifesto_text.trim()
            ? form.manifesto_text.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 8)
            : null,
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
  // Politicians don't use on-site voting (Kenya holds official elections elsewhere)
  useEffect(() => {
    if (isPolitician && form.is_voting_enabled) {
      setForm(f => ({ ...f, is_voting_enabled: false }));
    }
  }, [isPolitician]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Create a Banner | KenyaAdvert" description="Promote your business, event, or political campaign with a shareable banner page on KenyaAdvert." canonical="https://www.kenyaadverts.com/banners/new" />
      <Navbar />
      <main className="container-app max-w-2xl py-6 md:py-10">
        <h1 className="mb-1 text-3xl font-bold flex items-center gap-2"><Megaphone className="h-7 w-7 text-primary" />Create Banner</h1>
        <p className="mb-6 text-sm text-muted-foreground">Create a shareable showcase for a campaign, brand or cause. Events now have their own dedicated event pages.</p>

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
              {imgPreviews[0] ? (
                <img src={imgPreviews[0]} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-primary/60">
                  <ImagePlus className="h-10 w-10" />
                  <span className="text-sm font-medium">
                    {isPolitician ? "Add up to 3 posters" : "Add up to 3 banner images"}
                  </span>
                </div>
              )}
              <input type="file" accept="image/*" multiple onChange={(e) => handleImages(e.target.files)} className="absolute inset-0 cursor-pointer opacity-0" />
            </label>
            {imgPreviews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto border-t border-border bg-card p-3">
                {imgPreviews.map((src, index) => (
                  <div key={src} className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <img src={src} alt={`Banner image ${index + 1}`} className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              <RichDescriptionEditor
                value={form.description}
                onChange={(description) => setForm({ ...form, description })}
                placeholder={isPolitician ? "Your manifesto, slogan, or message to voters" : "Tell visitors more about your campaign or offer"}
              />
            </div>
            <div>
              <Label>Target link <span className="text-xs font-normal text-muted-foreground">(optional — leave blank if your banner is just for awareness)</span></Label>
              <Input type="url" placeholder="https://yoursite.com (optional)" value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} />
            </div>
            {!isPolitician && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Enable voting</Label>
                  <p className="text-xs text-muted-foreground">Each visitor can vote once.</p>
                </div>
                <Switch checked={form.is_voting_enabled} onCheckedChange={(v) => setForm({ ...form, is_voting_enabled: v })} />
              </div>
            )}
          </Card>

          {isPolitician && (
            <Card className="space-y-4 border-primary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                🇰🇪 Campaign details (Kenyan election style)
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Position seeking</Label>
                  <Input list="ke-positions" placeholder="e.g. Member of Parliament" value={form.running_position} onChange={(e) => setForm({ ...form, running_position: e.target.value })} />
                  <datalist id="ke-positions">
                    <option value="President" />
                    <option value="Governor" />
                    <option value="Senator" />
                    <option value="Member of Parliament" />
                    <option value="Woman Representative" />
                    <option value="Member of County Assembly (MCA)" />
                  </datalist>
                </div>
                <div>
                  <Label>Party / Coalition</Label>
                  <Input placeholder="e.g. UDA, ODM, Wiper, Independent" value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} />
                </div>
                <div>
                  <Label>Party color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.party_color} onChange={(e) => setForm({ ...form, party_color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background" />
                    <Input value={form.party_color} onChange={(e) => setForm({ ...form, party_color: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Candidate / Ballot number</Label>
                  <Input placeholder="e.g. 03" value={form.candidate_number} onChange={(e) => setForm({ ...form, candidate_number: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Slogan</Label>
                <Input placeholder="e.g. Kazi ni Kazi — Tukutane Tarehe Tisa" value={form.slogan} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
              </div>
              <div>
                <Label>Manifesto highlights (one per line, max 8)</Label>
                <textarea className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={"Better roads in every ward\nFree NHIF for elders\nYouth empowerment fund"} value={form.manifesto_text} onChange={(e) => setForm({ ...form, manifesto_text: e.target.value })} />
              </div>
            </Card>
          )}

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
