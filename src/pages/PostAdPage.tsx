import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, KENYA_COUNTIES } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/services/uploadService";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { Check, Wand2, ArrowLeft, ArrowRight, Crown, Star, Zap, Loader2, Camera, X, ChevronRight, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText } from "lucide-react";
import { compressImages } from "@/lib/image-compress";
import { useSiteConfig, getPrice } from "@/hooks/use-site-config";
import { getFieldsForCategory } from "@/lib/category-fields";
import RichDescriptionEditor from "@/components/RichDescriptionEditor";

const STEPS = ["Category", "Photos", "Details", "Package"];

type DraftPayload = {
  step: number;
  selectedCategory: string;
  selectedSubcategory: string;
  title: string;
  description: string;
  price: string;
  negotiable: boolean;
  condition: string;
  county: string;
  town: string;
  phone: string;
  whatsapp: string;
  selectedPackage: string;
  mpesaPhone: string;
  isListed?: boolean;
  dynamicFieldValues?: Record<string, string>;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package,
  Tractor, Settings, Hammer, Shirt, Tag, Store, FileText,
};

const PostAdPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: siteConfig } = useSiteConfig();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [condition, setCondition] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postedAdId, setPostedAdId] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});
  const [isListed, setIsListed] = useState(true);

  const draftKey = user ? `post-ad-draft:${user.id}` : null;
  const dynamicFields = getFieldsForCategory(selectedCategory, selectedSubcategory);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step, success]);

  useEffect(() => {
    if (!user || !draftKey) {
      setDraftRestored(true);
      return;
    }

    const raw = localStorage.getItem(draftKey);
    if (!raw) {
      setDraftRestored(true);
      return;
    }

    try {
      const draft = JSON.parse(raw) as DraftPayload;
      setStep(Math.min(Math.max(draft.step || 0, 0), 3));
      setSelectedCategory(draft.selectedCategory || "");
      setSelectedSubcategory(draft.selectedSubcategory || "");
      setTitle(draft.title || "");
      setDescription(draft.description || "");
      setPrice(draft.price || "");
      setNegotiable(Boolean(draft.negotiable));
      setCondition(draft.condition || "");
      setCounty(draft.county || "");
      setTown(draft.town || "");
      setPhone(draft.phone || "");
      setWhatsapp(draft.whatsapp || "");
      setSelectedPackage(draft.selectedPackage || "standard");
      setMpesaPhone(draft.mpesaPhone || "");
      setIsListed(draft.isListed !== false);
      setDynamicFieldValues(draft.dynamicFieldValues || {});

      toast({ title: "Draft restored", description: "We restored your ad details after refresh." });
    } catch {
      localStorage.removeItem(draftKey);
    } finally {
      setDraftRestored(true);
    }
  }, [user, draftKey]);

  useEffect(() => {
    if (!user || !draftRestored || !draftKey || success) return;

    const draft: DraftPayload = {
      step,
      selectedCategory,
      selectedSubcategory,
      title,
      description,
      price,
      negotiable,
      condition,
      county,
      town,
      phone,
      whatsapp,
      selectedPackage,
      mpesaPhone,
      dynamicFieldValues,
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [
    user,
    draftRestored,
    draftKey,
    success,
    step,
    selectedCategory,
    selectedSubcategory,
    title,
    description,
    price,
    negotiable,
    condition,
    county,
    town,
    phone,
    whatsapp,
    selectedPackage,
    mpesaPhone,
    dynamicFieldValues,
  ]);

  useEffect(() => {
    setDynamicFieldValues((prev) => {
      const allowedKeys = new Set(dynamicFields.map((field) => field.key));
      return Object.fromEntries(Object.entries(prev).filter(([key]) => allowedKeys.has(key)));
    });
  }, [selectedCategory, selectedSubcategory]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !draftRestored) return;

      const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).single();

      if (profile?.phone) {
        setPhone((prev) => prev || profile.phone);
        setWhatsapp((prev) => prev || profile.phone);
        setMpesaPhone((prev) => prev || profile.phone);
      }

      const { data: business } = await supabase
        .from("business_profiles")
        .select("location, phone, whatsapp")
        .eq("user_id", user.id)
        .single();

      if (business) {
        if (business.phone) setPhone((prev) => prev || business.phone || "");
        if (business.whatsapp) setWhatsapp((prev) => prev || business.whatsapp || "");
        if (business.location) {
          const parts = business.location.split(",");
          if (parts.length > 0) setCounty((prev) => prev || parts[0].trim());
          if (parts.length > 1) setTown((prev) => prev || parts[1].trim());
        }
      }

      const { data: lastAd } = await supabase
        .from("ads")
        .select("county, town, phone, whatsapp")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastAd) {
        if (lastAd.county) setCounty((prev) => prev || lastAd.county);
        if (lastAd.town) setTown((prev) => prev || lastAd.town);
        if (lastAd.phone) setPhone((prev) => prev || lastAd.phone);
        if (lastAd.whatsapp) setWhatsapp((prev) => prev || lastAd.whatsapp);
      }
    };

    loadProfile();
  }, [user, draftRestored]);

  // Load credit balance
  useEffect(() => {
    if (!user) return;
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setCreditsBalance(data?.balance ?? 0));
  }, [user]);

  const resetForm = () => {
    setStep(0);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setExpandedCat(null);
    setPhotos([]);
    setPhotoPreviews([]);
    setMainPhotoIndex(0);
    setTitle("");
    setDescription("");
    setPrice("");
    setNegotiable(false);
    setCondition("");
    setCounty("");
    setTown("");
    setPhone("");
    setWhatsapp("");
    setSelectedPackage("standard");
    setMpesaPhone("");
    setDynamicFieldValues({});
    setPaymentLoading(false);
    setPaymentStatus(null);
    setAiLoading(false);
    setSuccess(false);
    setPublishing(false);
    setPostedAdId(null);
    if (draftKey) localStorage.removeItem(draftKey);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 py-20 text-center">
          <h1 className="font-heading font-bold text-xl text-foreground mb-3">Sign in to Post an Ad</h1>
          <p className="text-muted-foreground text-sm mb-6">You need an account to post ads on KenyaAdvert</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/login")} className="h-10">Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/register")} className="h-10">Register</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // Reset so the same file can be re-picked
    if (files.length === 0) return;

    const valid = files.filter((f) => f.size <= 25 * 1024 * 1024 && /^image\//i.test(f.type));
    const rejected = files.length - valid.length;
    if (rejected > 0) {
      toast({ title: `${rejected} file(s) skipped`, description: "Only images under 25MB are supported.", variant: "destructive" });
    }
    if (valid.length === 0) return;

    try {
      const compressed = await compressImages(valid);
      const nextPhotos = [...photos, ...compressed].slice(0, 5);
      setPhotos(nextPhotos);
      // Revoke old preview URLs to free memory
      photoPreviews.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
      setPhotoPreviews(nextPhotos.map((f) => URL.createObjectURL(f)));

      if (nextPhotos.length === 0) setMainPhotoIndex(0);
      else if (mainPhotoIndex >= nextPhotos.length) setMainPhotoIndex(0);
    } catch (err: any) {
      toast({ title: "Couldn't process photo", description: "Try a smaller image or one at a time.", variant: "destructive" });
    }
  };

  const removePhoto = (idx: number) => {
    const nextPhotos = photos.filter((_, i) => i !== idx);
    const nextPreviews = photoPreviews.filter((_, i) => i !== idx);

    setPhotos(nextPhotos);
    setPhotoPreviews(nextPreviews);

    if (idx === mainPhotoIndex) setMainPhotoIndex(0);
    else if (idx < mainPhotoIndex) setMainPhotoIndex((prev) => prev - 1);
  };

  const enhanceWithAI = async () => {
    if (!title.trim()) {
      toast({ title: "Enter a title first", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { title, category: selectedCategory, subcategory: selectedSubcategory, condition },
      });
      if (error) throw error;
      if (data?.description) {
        setDescription(data.description);
        toast({ title: "Description generated!" });
      }
    } catch (err: any) {
      toast({ title: "AI generation failed", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const publishAd = async (badge: string) => {
    setPublishing(true);
    setUploadProgress(0);

    const imageUrls: string[] = [];
    const orderedPhotos = photos.length
      ? [photos[mainPhotoIndex], ...photos.filter((_, idx) => idx !== mainPhotoIndex)]
      : [];

    const totalPhotos = orderedPhotos.length || 1;
    for (let i = 0; i < orderedPhotos.length; i++) {
      const photo = orderedPhotos[i];
      try {
        const url = await uploadFile(photo);
        imageUrls.push(url);
      } catch (err) {
        console.error("Upload failed for photo:", err);
      }
      setUploadProgress(Math.round(((i + 1) / totalPhotos) * 100));
    }

    // Resolve category_id and subcategory_id
    let categoryId: string | null = null;
    let subcategoryId: string | null = null;

    // Build attributes JSONB from dynamic fields (only non-empty values)
    const attributesPayload: Record<string, string> = {};
    for (const field of dynamicFields) {
      const value = dynamicFieldValues[field.key]?.trim();
      if (value) attributesPayload[field.key] = value;
    }

    // Description stays as-is — the specs table renders attributes separately on the detail page.
    const finalDescription = description.trim();

    if (selectedCategory) {
      const { data: catRow } = await supabase.from("categories").select("id").eq("name", selectedCategory).single();
      if (catRow) {
        categoryId = catRow.id;
        if (selectedSubcategory) {
          const { data: subRow } = await supabase.from("subcategories").select("id").eq("category_id", catRow.id).eq("name", selectedSubcategory).single();
          if (subRow) subcategoryId = subRow.id;
        }
      }
    }

    const { data, error } = await supabase
      .from("ads")
      .insert({
        user_id: user.id,
        title,
        description: finalDescription,
        price: Number(price) || 0,
        is_negotiable: negotiable,
        condition: condition || "Used",
        county,
        town,
        phone,
        whatsapp: whatsapp || null,
        images: imageUrls,
        badge,
        status: "active",
        category_id: categoryId,
        subcategory_id: subcategoryId,
        attributes: attributesPayload,
      } as any)
      .select("id, ad_code")
      .single();

    if (error) {
      setPublishing(false);
      setPaymentLoading(false);
      toast({ title: "Error posting ad", description: error.message, variant: "destructive" });
      return;
    }

    // Deduct credits if user opted (only for silver/gold to reduce payment amount)
    if (useCredits && creditsBalance && creditsBalance > 0 && (badge === "silver" || badge === "gold")) {
      const creditsToUse = Math.min(creditsBalance, badge === "silver" ? 5 : 10);
      await supabase
        .from("credits")
        .update({ balance: creditsBalance - creditsToUse, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      setCreditsBalance(creditsBalance - creditsToUse);
    }

    if (draftKey) localStorage.removeItem(draftKey);
    setPostedAdId(data?.id || null);
    setPaymentLoading(false);
    setPublishing(false);
    setSuccess(true);
    toast({ title: "Ad posted successfully!" });
  };

  const getPaymentErrorMessage = (message?: string) => {
    if (!message) return "Payment failed. Please try again.";
    if (message.toLowerCase().includes("payhero credentials not configured")) {
      return "Payment is temporarily unavailable while gateway credentials are being finalized.";
    }
    return message;
  };

  const handleSubmit = async () => {
    if (selectedPackage === "standard") {
      await publishAd("standard");
      return;
    }

    // Calculate amount after credits
    const silverPrice = getPrice(siteConfig, "silver_price", 299);
    const goldPrice = getPrice(siteConfig, "gold_price", 599);
    const baseAmount = selectedPackage === "silver" ? silverPrice : goldPrice;
    const creditsToApply = useCredits && creditsBalance ? Math.min(creditsBalance, selectedPackage === "silver" ? 5 : 10) : 0;
    const amount = Math.max(baseAmount - creditsToApply, 0);
    setPaymentLoading(true);
    setPublishing(true);

    try {
      const result = await initiatePayment({ phone: mpesaPhone, amount, package_type: selectedPackage, user_id: user.id });
      setPaymentStatus("pending");
      toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to complete payment" });

      const interval = setInterval(async () => {
        try {
          const status = await verifyPayment(result.transaction_id);
          if (status.status === "completed") {
            clearInterval(interval);
            setPaymentStatus("completed");
            await publishAd(selectedPackage);
          } else if (status.status === "failed") {
            clearInterval(interval);
            setPaymentStatus("failed");
            setPaymentLoading(false);
            setPublishing(false);
            toast({ title: "Payment failed", description: "Please try again", variant: "destructive" });
          }
        } catch {
          // keep polling
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(interval);
        setPaymentLoading(false);
        setPublishing(false);
      }, 120000);
    } catch (err: any) {
      setPaymentLoading(false);
      setPublishing(false);
      toast({ title: "Payment error", description: getPaymentErrorMessage(err?.message), variant: "destructive" });
    }
  };

  const silverPrice = getPrice(siteConfig, "silver_price", 299);
  const goldPrice = getPrice(siteConfig, "gold_price", 599);

  const getPackageDisplayPrice = (pkgId: string, basePrice: string) => {
    if (!useCredits || !creditsBalance || creditsBalance <= 0) return basePrice;
    if (pkgId === "silver") {
      const discount = Math.min(creditsBalance, 5);
      return `KSh ${silverPrice - discount}`;
    }
    if (pkgId === "gold") {
      const discount = Math.min(creditsBalance, 10);
      return `KSh ${goldPrice - discount}`;
    }
    return basePrice;
  };

  const packages = [
    { id: "standard", name: "Standard", price: "FREE", icon: Zap, color: "text-primary", features: ["Basic listing", "Appears in normal feed", "30 days active"] },
    { id: "silver", name: "Silver", price: `KSh ${silverPrice}`, icon: Star, color: "text-silver", features: ["Silver badge", "3x more engagement", "Page 1 boost", "60 days active"] },
    { id: "gold", name: "Gold", price: `KSh ${goldPrice}`, icon: Crown, color: "text-gold", features: ["GOLD badge", "Gold card design", "6x engagement", "Homepage featured", "90 days active"] },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Your ad is now live!</h2>
            <p className="text-muted-foreground text-sm mb-8">Thousands of buyers can now see your listing</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate(postedAdId ? `/my-ads?highlight=${postedAdId}` : "/my-ads")} className="h-12 w-full">View My Ads</Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
                }}
                className="h-12 w-full"
              >
                Post Another Ad
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Post a Free Ad — Sell on KenyaAdvert" description="Post your ad for free on KenyaAdvert. Sell phones, cars, electronics, property, services and more to buyers across all 47 counties in Kenya." canonical="https://www.kenyaadverts.com/post-ad" ogImage="https://www.kenyaadverts.com/og/og-post-ad.png" keywords="post free ad Kenya, sell online Kenya, free classifieds Kenya, post ad Nairobi, sell phone Kenya, sell car Kenya, list item free, advertise online Kenya, create listing Kenya, sell electronics, sell property, sell services Kenya, KenyaAdvert post ad, free listing platform, sell fast Kenya, how to sell online Kenya, classified ad posting, Nairobi sell, Mombasa sell, upload photos ad, M-Pesa payment listing" />
      <Navbar />

      {publishing && (
        <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <h3 className="font-heading font-semibold text-foreground mb-1">
              {uploadProgress < 100 ? "Uploading photos..." : paymentLoading ? "Waiting for M-Pesa..." : "Publishing your ad..."}
            </h3>
            {photos.length > 0 && uploadProgress < 100 && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading {photos.length} photo{photos.length > 1 ? "s" : ""}...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">Please wait, we are saving your listing.</p>
          </div>
        </div>
      )}

      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        i < step
                          ? "bg-primary text-primary-foreground"
                          : i === step
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < step ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 text-center ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mt-[-14px] rounded ${i < step ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>
          </div>

          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4">What are you selling?</h2>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat.name} className="bg-card rounded-xl border border-border/60 overflow-hidden">
                    {(() => {
                      const Icon = iconMap[cat.icon] || FileText;

                      return (
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
                      className="w-full grid min-w-0 grid-cols-[2.5rem,1fr,auto] items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted/50"
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="min-w-0 break-words text-left text-sm font-medium text-foreground [word-break:break-word]">{cat.name}</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCat === cat.name ? "rotate-90" : ""}`} />
                    </button>
                      );
                    })()}
                    {expandedCat === cat.name && (
                      <div className="px-4 pb-3 border-t border-border/40 pt-2">
                        <div className="space-y-1">
                          {cat.subcategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => {
                                setSelectedCategory(cat.name);
                                setSelectedSubcategory(sub);
                                setStep(1);
                              }}
                              className="w-full text-left text-sm px-3 py-2.5 rounded-lg active:bg-muted transition-colors flex items-center justify-between text-muted-foreground"
                            >
                              <span>{sub}</span>
                              <span className="text-[10px] text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-full">1 credit</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-1">Add Photos</h2>
              <p className="text-xs text-muted-foreground mb-5">Photos get 5x more customers. Add up to 5 photos.</p>

              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {Array.from({ length: Math.max(photos.length + 1, 3) }, (_, idx) => idx).slice(0, 5).map((idx) => (
                  <div key={idx} className="relative">
                    {photoPreviews[idx] ? (
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary bg-muted">
                        <img src={photoPreviews[idx]} alt="" className="w-full h-full object-cover" />
                        {idx === mainPhotoIndex && (
                          <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold">MAIN</span>
                        )}
                        {idx !== mainPhotoIndex && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMainPhotoIndex(idx);
                            }}
                            className="absolute bottom-1.5 left-1.5 bg-card/90 text-foreground text-[9px] px-1.5 py-0.5 rounded font-semibold"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer active:border-primary/50 transition-colors bg-muted/30">
                        <Camera className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">{idx === 0 ? "Main" : `Photo ${idx + 1}`}</span>
                        <input type="file" accept=".jpg,.jpeg,.png,.heic" multiple onChange={handlePhotos} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground mb-6 text-center">JPG, PNG, HEIC — Max 10MB each. Select multiple at once.</p>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="h-12 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={photos.length === 0} className="h-12 flex-1">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
              <div className="bg-card rounded-xl border border-border/60 p-4">
                <h2 className="font-heading font-bold text-lg text-foreground mb-1">Tell us about your item</h2>
                <p className="text-xs text-muted-foreground">This draft auto-saves while you type.</p>
              </div>

              <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Ad Title *</Label>
                  <Input placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 h-12 text-base" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-medium">Description</Label>
                    <button
                      onClick={enhanceWithAI}
                      disabled={aiLoading || !title.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg disabled:opacity-50 active:opacity-80 transition-opacity"
                    >
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {aiLoading ? "Generating..." : "AI Enhance"}
                    </button>
                  </div>
                  <RichDescriptionEditor value={description} onChange={setDescription} />
                </div>
              </div>

              {(() => {
                const cat = (selectedCategory || "").toLowerCase();
                const sub = (selectedSubcategory || "").toLowerCase();
                const isEvent = sub.includes("event") || cat.includes("event");
                const isJob = cat === "jobs" || cat.includes("job");
                const isService = cat === "services" || cat.includes("service");
                const hideCondition = isEvent || isJob || isService;
                const priceLabel = isEvent ? "Ticket Price (KSh) — 0 for free"
                  : isJob ? "Salary (KSh / month)"
                  : isService ? "Starting Price (KSh)"
                  : "Price (KSh)";
                if (hideCondition) {
                  return (
                    <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
                      <h3 className="font-heading font-semibold text-sm text-foreground">Pricing</h3>
                      <div>
                        <Label className="text-sm font-medium">{priceLabel}</Label>
                        <Input type="number" inputMode="numeric" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 h-12 text-base" />
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
                    <h3 className="font-heading font-semibold text-sm text-foreground">Pricing & Condition</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">{priceLabel}</Label>
                        <Input type="number" inputMode="numeric" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 h-12 text-base" />
                      </div>
                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                          <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="w-5 h-5 rounded border-input" />
                          Negotiable
                        </label>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Condition</Label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="w-full h-12 mt-1.5 px-3 rounded-lg border border-input bg-background text-base"
                      >
                        <option value="">Please select one</option>
                        <option value="New">Brand New</option>
                        <option value="Refurbished">Refurbished</option>
                        <option value="Used">Used</option>
                        <option value="Slightly Used">Slightly Used</option>
                      </select>
                    </div>
                  </div>
                );
              })()}

              {dynamicFields.length > 0 && (
                <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
                  <h3 className="font-heading font-semibold text-sm text-foreground">{selectedSubcategory || selectedCategory} Details</h3>
                  <p className="text-[11px] text-muted-foreground -mt-2">Fill what applies. These appear as a clean specs table on your listing.</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {dynamicFields.map((field) => {
                      const colSpan = field.fullWidth ? "sm:col-span-2" : "";
                      const value = dynamicFieldValues[field.key] || "";
                      const setValue = (v: string) => setDynamicFieldValues((prev) => ({ ...prev, [field.key]: v }));

                      return (
                        <div key={field.key} className={colSpan}>
                          <Label className="text-sm font-medium">{field.label}</Label>
                          {field.type === "select" ? (
                            <select
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className="w-full h-12 mt-1.5 px-3 rounded-lg border border-input bg-background text-base"
                            >
                              <option value="">Please select one</option>
                              {(field.options || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === "textarea" ? (
                            <Textarea
                              placeholder={field.placeholder}
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className="mt-1.5 min-h-[80px] text-base"
                            />
                          ) : (
                            <Input
                              type={field.type === "number" ? "number" : field.type || "text"}
                              inputMode={field.type === "number" ? "numeric" : undefined}
                              placeholder={field.placeholder}
                              value={value}
                              onChange={(e) => setValue(e.target.value)}
                              className="mt-1.5 h-12 text-base"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-card rounded-xl border border-border/60 p-4 space-y-4">
                <h3 className="font-heading font-semibold text-sm text-foreground">Location & Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">County *</Label>
                    <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-12 mt-1.5 px-3 rounded-lg border border-input bg-background text-base">
                      <option value="">Select</option>
                      {KENYA_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Town / Area</Label>
                    <Input placeholder="e.g. Westlands" value={town} onChange={(e) => setTown(e.target.value)} className="mt-1.5 h-12 text-base" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Phone *</Label>
                    <Input placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-12 text-base" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">WhatsApp</Label>
                    <Input placeholder="0712345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1.5 h-12 text-base" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="h-12 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!title || !county || !phone} className="h-12 flex-1">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-2">Boost Your Ad</h2>

              {creditsBalance !== null && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Your Credits: <span className="text-primary font-bold">{creditsBalance}</span></p>
                    <p className="text-[11px] text-muted-foreground">Use credits to reduce Silver/Gold package price</p>
                  </div>
                  {creditsBalance > 0 && (selectedPackage === "silver" || selectedPackage === "gold") && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useCredits} onChange={(e) => setUseCredits(e.target.checked)} className="w-5 h-5 rounded border-input" />
                      <span className="text-xs font-medium text-foreground">
                        Use {Math.min(creditsBalance, selectedPackage === "silver" ? 5 : 10)} credits
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPackage === pkg.id
                        ? pkg.id === "gold"
                          ? "border-gold bg-gold/5"
                          : pkg.id === "silver"
                            ? "border-silver bg-silver/5"
                            : "border-primary bg-primary/5"
                        : "border-border/60 bg-card active:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <pkg.icon className={`w-5 h-5 ${pkg.color}`} />
                        <span className="font-heading font-bold text-sm text-foreground">{pkg.name}</span>
                      </div>
                      <span className={`font-bold text-sm ${pkg.color}`}>{getPackageDisplayPrice(pkg.id, pkg.price)}</span>
                    </div>
                    <ul className="space-y-1">
                      {pkg.features.map((f) => (
                        <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Check className={`w-3 h-3 flex-shrink-0 ${pkg.color}`} /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {selectedPackage !== "standard" && (
                <div className="bg-card rounded-xl border border-border/60 p-4 mb-6">
                  <Label className="text-sm font-medium">M-Pesa Phone Number</Label>
                  <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="mt-1.5 h-12 text-base" />
                  {paymentStatus === "pending" && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Check your phone for M-Pesa prompt...
                    </div>
                  )}
                </div>
              )}

              {selectedPackage === "standard" && creditsBalance !== null && creditsBalance <= 0 && !useCredits && (
                <div className="bg-muted/60 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs text-muted-foreground mb-2">You have no credits. Buy credits to post for free next time.</p>
                  <Button variant="outline" size="sm" onClick={() => navigate("/credits")} className="h-8 text-xs">
                    Buy Credits
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="h-12 flex-1" disabled={publishing}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={paymentLoading || publishing || (selectedPackage !== "standard" && !mpesaPhone)} className="h-12 flex-1">
                  {paymentLoading || publishing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                  ) : selectedPackage === "standard" ? (
                    "Post Ad"
                  ) : (
                    "Pay & Post"
                  )}
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

export default PostAdPage;
