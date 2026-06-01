import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
import { ImagePlus, Loader2, Megaphone, Phone, X } from "lucide-react";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";
import { toast } from "sonner";
import { uploadBanner } from "@/services/uploadService";
import { useAdmin } from "@/hooks/use-admin";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { getPrice, useSiteConfig } from "@/hooks/use-site-config";

const CATEGORIES = [
  { key: "politician", label: "Politician / Voting" },
  { key: "business", label: "Business" },
  { key: "ngo", label: "NGO / Cause" },
  { key: "other", label: "Other" },
];

const KENYAN_COUNTIES = [
  "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir","Mandera",
  "Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua",
  "Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia",
  "Uasin Gishu","Elgeyo-Marakwet","Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado",
  "Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay",
  "Migori","Kisii","Nyamira","Nairobi",
];

const COUNTRIES = ["Kenya","Uganda","Tanzania","Rwanda","Burundi","South Sudan","Ethiopia","Somalia"];

const KE_POSITIONS = [
  "President","Deputy President","Governor","Deputy Governor","Senator","Member of Parliament",
  "Woman Representative","Member of County Assembly (MCA)","Ward Representative",
];

const POLITICS_PRICE_TIERS = [1000, 3000, 5000];
const OTHER_PRICE_TIERS = [500, 750, 1000];

const CreateBannerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPoliticalFlow = location.pathname.startsWith("/politics");

  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdmin();
  const { data: siteConfig } = useSiteConfig();
  const [submitting, setSubmitting] = useState(false);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgPreviews, setImgPreviews] = useState<string[]>([]);
  const [nonPoliticalCount, setNonPoliticalCount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [form, setForm] = useState({
    business_name: "",
    description: "",
    target_url: "",
    category: isPoliticalFlow ? "politician" : "business",
    is_voting_enabled: false,
    country: "Kenya",
    county: "",
    // politician-only
    running_position: "",
    party_name: "",
    party_color: "#1B5E20",
    candidate_number: "",
    slogan: "",
    manifesto_text: "",
    is_listed: true,
  });
  const [parties, setParties] = useState<Array<{ id: string; name: string; color: string | null }>>([]);
  const [priceTier, setPriceTier] = useState<number>(isPoliticalFlow ? 1000 : 500);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("political_parties" as any)
        .select("id,name,color")
        .eq("country", form.country)
        .order("name");
      setParties((data as any) || []);
    })();
  }, [form.country]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in");
      navigate("/login?redirect=/banners/new");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const loadCount = async () => {
      const { count } = await supabase
        .from("banner_campaigns" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("category", "politician");
      setNonPoliticalCount(count || 0);
    };
    loadCount();
  }, [user]);

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
      for (const file of imgFiles) {
        uploadedImages.push(await uploadBanner(file));
      }

      const price = calculateBannerPrice();
      if (price > 0 && !mpesaPhone.trim()) {
        toast.error("Enter your M-Pesa phone number");
        setSubmitting(false);
        return;
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
          status: price > 0 ? "pending_payment" : "active",
          is_listed: form.is_listed,
          package_type: price > 0 ? "banner_creation" : "self_serve",
          amount_paid: price > 0 ? 0 : price,
          country: form.country || "Kenya",
          county: form.county.trim() || null,
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


      if (price > 0) {
        setPaymentMessage("Sending M-Pesa STK push...");
        const result = await initiatePayment({
          phone: mpesaPhone,
          amount: price,
          package_type: "banner_creation",
          banner_id: (data as any).id,
          user_id: user.id,
        });
        await supabase.from("banner_campaigns" as any).update({ payment_id: result.payment_id } as any).eq("id", (data as any).id);
        toast.success("STK push sent — check your phone");
        setPaymentMessage("Waiting for M-Pesa confirmation...");
        const started = Date.now();
        while (Date.now() - started < 120000) {
          await new Promise((resolve) => window.setTimeout(resolve, 3000));
          const status = await verifyPayment(result.transaction_id).catch(() => null);
          if (status?.status === "completed") {
            toast.success("Payment confirmed. Banner published!");
            navigate(`/${form.category === "politician" ? "politics" : "banners"}/${(data as any).slug || (data as any).id}`);
            return;
          }
          if (status?.status === "failed") throw new Error("M-Pesa payment failed");
        }
        toast.info("Payment is still pending. Your banner will publish automatically after confirmation.");
        navigate("/my-campaigns");
        return;
      }

      toast.success(form.category === "politician" ? "Campaign published!" : "Banner published!");
      navigate(`/${form.category === "politician" ? "politics" : "banners"}/${(data as any).slug || (data as any).id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const isPolitician = form.category === "politician";
  const calculateBannerPrice = () => {
    if (form.category === "politician") {
      const configuredFee = getPrice(siteConfig, "post_politics_fee", priceTier);
      return configuredFee > 0 ? configuredFee : 0;
    }
    if (isAdmin) return 0;
    if (siteConfig?.require_payment_banner === "true") return getPrice(siteConfig, "post_banner_fee", priceTier) || priceTier;
    return nonPoliticalCount === 0 ? 0 : priceTier;
  };
  const bannerPrice = calculateBannerPrice();
  const priceTiers = isPolitician ? POLITICS_PRICE_TIERS : OTHER_PRICE_TIERS;
  useEffect(() => {
    // Reset tier when switching category
    setPriceTier(isPolitician ? 1000 : 500);
  }, [isPolitician]);
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
        <h1 className="mb-1 text-3xl font-bold flex items-center gap-2"><Megaphone className="h-7 w-7 text-primary" />{isPoliticalFlow ? "Create Political Campaign" : "Create Banner"}</h1>
        <p className="mb-6 text-sm text-muted-foreground">{isPoliticalFlow ? "Set up a dedicated campaign page for your 2027 political run." : "Create a shareable showcase for a brand, NGO or cause."}</p>

        <form onSubmit={onSubmit} className="space-y-5">
          <Card className="space-y-4 p-4">
            {!isPoliticalFlow && (
              <div>
                <Label>Category</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CATEGORIES.filter(c => c.key !== "politician").map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Recommended image: 3:1 wide banner (e.g. 1200×400)</p>
              </div>
            )}
            {isPoliticalFlow && (
              <p className="text-xs text-muted-foreground">Recommended image: 4:5 portrait poster (e.g. 1080×1350)</p>
            )}

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Banner package</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {priceTiers.map((tier) => {
                    const labels: Record<number, string> = isPolitician
                      ? { 1000: "Starter • 7d", 3000: "Standard • 21d", 5000: "Premium • 45d" }
                      : { 500: "Starter • 7d", 1000: "Standard • 14d", 3000: "Featured • 30d" };
                    const active = priceTier === tier;
                    return (
                      <button
                        type="button"
                        key={tier}
                        onClick={() => setPriceTier(tier)}
                        className={`rounded-lg border-2 p-2 text-left transition ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                      >
                        <p className="text-xs font-bold text-foreground">KSh {tier.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{labels[tier]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">You pay</p>
                <p className="text-2xl font-heading font-bold text-primary">{bannerPrice === 0 ? "Free" : `KSh ${bannerPrice.toLocaleString()}`}</p>
                <p className="text-xs text-muted-foreground">
                  {isPolitician && bannerPrice > 0 ? "Political campaigns must be paid before publishing." : isAdmin ? "Admin users publish non-political banners free." : bannerPrice > 0 ? "Payment is required before this page is published." : nonPoliticalCount === 0 ? "Your first non-political banner is free." : "Posting is currently free for this section."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Country</Label>
                <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, county: "" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>County / Region</Label>
                {form.country === "Kenya" ? (
                  <select value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— Nationwide —</option>
                    {KENYAN_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <Input placeholder="Region (optional)" value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} />
                )}
              </div>
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
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <Label>List on the public Banners page</Label>
                <p className="text-xs text-muted-foreground">If off, your banner still works via direct link & sharing, but won't appear in the public banners grid.</p>
              </div>
              <Switch checked={form.is_listed} onCheckedChange={(v) => setForm({ ...form, is_listed: v })} />
            </div>
          </Card>

          {bannerPrice > 0 && (
            <Card className="space-y-3 border-primary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Phone className="h-4 w-4" /> M-Pesa payment
              </div>
              <div>
                <Label>M-Pesa phone number</Label>
                <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} />
              </div>
              {paymentMessage && <p className="text-xs font-medium text-primary">{paymentMessage}</p>}
            </Card>
          )}

          {isPolitician && (
            <Card className="space-y-4 border-primary/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                Campaign details
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
                  <select
                    value={form.party_name}
                    onChange={(e) => {
                      const selected = parties.find(p => p.name === e.target.value);
                      setForm({ ...form, party_name: e.target.value, party_color: selected?.color || form.party_color });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Independent —</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
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
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{bannerPrice > 0 ? "Processing M-Pesa..." : "Publishing..."}</> : bannerPrice > 0 ? `Pay KSh ${bannerPrice.toLocaleString()} & Publish` : "Publish Banner"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CreateBannerPage;
