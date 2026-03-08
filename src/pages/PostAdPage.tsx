import { useState, useEffect } from "react";
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
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { Check, Upload, Wand2, ArrowLeft, ArrowRight, Crown, Star, Zap, Loader2, Camera, X, ChevronRight } from "lucide-react";

const STEPS = ["Category", "Photos", "Details", "Package"];

const PostAdPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
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

  // Load user profile data for pre-filling
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();
      
      if (profile?.phone) {
        setPhone(profile.phone);
        setWhatsapp(profile.phone);
        setMpesaPhone(profile.phone);
      }

      // Check if user has business profile for location
      const { data: business } = await supabase
        .from("business_profiles")
        .select("location, phone, whatsapp")
        .eq("user_id", user.id)
        .single();

      if (business) {
        if (business.phone) setPhone(business.phone);
        if (business.whatsapp) setWhatsapp(business.whatsapp);
        if (business.location) {
          const parts = business.location.split(",");
          if (parts.length > 0) setCounty(parts[0].trim());
          if (parts.length > 1) setTown(parts[1].trim());
        }
      }

      // Check last ad for county/town
      const { data: lastAd } = await supabase
        .from("ads")
        .select("county, town, phone, whatsapp")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastAd) {
        if (!county && lastAd.county) setCounty(lastAd.county);
        if (!town && lastAd.town) setTown(lastAd.town);
        if (!phone && lastAd.phone) setPhone(lastAd.phone);
        if (!whatsapp && lastAd.whatsapp) setWhatsapp(lastAd.whatsapp);
      }
    };
    loadProfile();
  }, [user]);

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

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024 && /\.(jpg|jpeg|png|heic)$/i.test(f.name));
    const newPhotos = [...photos, ...valid].slice(0, 3);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== idx));
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

  const handleSubmit = async () => {
    if (selectedPackage === "standard") {
      await publishAd("standard");
    } else {
      const amount = selectedPackage === "silver" ? 299 : 599;
      setPaymentLoading(true);
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
              toast({ title: "Payment failed", description: "Please try again", variant: "destructive" });
            }
          } catch {}
        }, 3000);
        setTimeout(() => { clearInterval(interval); setPaymentLoading(false); }, 120000);
      } catch (err: any) {
        setPaymentLoading(false);
        toast({ title: "Payment error", description: err.message, variant: "destructive" });
      }
    }
  };

  const publishAd = async (badge: string) => {
    const imageUrls: string[] = [];
    for (const photo of photos) {
      const fileName = `${user.id}/${Date.now()}-${photo.name}`;
      const { error: uploadError } = await supabase.storage.from("ad-images").upload(fileName, photo);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(fileName);
        imageUrls.push(urlData.publicUrl);
      }
    }
    const { error } = await supabase.from("ads").insert({
      user_id: user.id, title, description, price: Number(price) || 0, is_negotiable: negotiable,
      condition: condition || "Used", county, town, phone, whatsapp: whatsapp || null, images: imageUrls, badge, status: "active",
    } as any);
    if (error) { toast({ title: "Error posting ad", description: error.message, variant: "destructive" }); return; }
    setSuccess(true);
    setPaymentLoading(false);
    toast({ title: "Ad posted successfully!" });
  };

  const packages = [
    { id: "standard", name: "Standard", price: "FREE", icon: Zap, color: "text-primary", features: ["Basic listing", "Appears in normal feed", "30 days active"] },
    { id: "silver", name: "Silver", price: "KSh 299", icon: Star, color: "text-silver", features: ["Silver badge", "3x more engagement", "Page 1 boost", "60 days active"] },
    { id: "gold", name: "Gold", price: "KSh 599", icon: Crown, color: "text-gold", features: ["GOLD badge", "Gold card design", "6x engagement", "Homepage featured", "90 days active"] },
  ];

  // Success screen
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
              <Button onClick={() => navigate("/my-ads")} className="h-12 w-full">View My Ads</Button>
              <Button variant="outline" onClick={() => { setSuccess(false); setStep(0); setPhotos([]); setPhotoPreviews([]); setTitle(""); setDescription(""); }} className="h-12 w-full">Post Another Ad</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          {/* Progress Steps - Mobile Optimized */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < step ? "bg-primary text-primary-foreground" : 
                      i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : 
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i < step ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1.5 text-center ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-[-14px] rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Category */}
          {step === 0 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4">What are you selling?</h2>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat.name} className="bg-card rounded-xl border border-border/60 overflow-hidden">
                    <button 
                      onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)} 
                      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                        <span className="text-lg">{cat.icon}</span>
                      </div>
                      <span className="font-medium text-sm text-foreground flex-1 text-left">{cat.name}</span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${expandedCat === cat.name ? "rotate-90" : ""}`} />
                    </button>
                    {expandedCat === cat.name && (
                      <div className="px-4 pb-3 border-t border-border/40 pt-2">
                        <div className="space-y-1">
                          {cat.subcategories.map((sub) => (
                            <button 
                              key={sub} 
                              onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(sub); setStep(1); }} 
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

          {/* Step 2: Photos */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-1">Add Photos</h2>
              <p className="text-xs text-muted-foreground mb-5">Photos get 5x more customers. Add up to 3 photos.</p>
              
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative">
                    {photoPreviews[idx] ? (
                      <div className="aspect-square rounded-xl overflow-hidden border-2 border-primary bg-muted">
                        <img src={photoPreviews[idx]} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold">MAIN</span>
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
                        <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">{idx === 0 ? "Main" : `Photo ${idx + 1}`}</span>
                        <input type="file" accept=".jpg,.jpeg,.png,.heic" onChange={handlePhotos} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground mb-6 text-center">JPG, PNG, HEIC — Max 10MB each</p>

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

          {/* Step 3: Details */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-5">Tell us about your item</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Ad Title *</Label>
                  <Input 
                    placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="mt-1.5 h-12 text-base" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="text-sm font-medium">Description</Label>
                    <button 
                      onClick={enhanceWithAI}
                      disabled={aiLoading || !title.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium rounded-lg disabled:opacity-50 active:opacity-80 transition-opacity"
                    >
                      {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      {aiLoading ? "Generating..." : "AI Enhance"}
                    </button>
                  </div>
                  <Textarea 
                    placeholder="Describe your item in detail..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="min-h-[100px] text-base" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Price (KSh)</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      className="mt-1.5 h-12 text-base" 
                    />
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
                  <Input 
                    placeholder="e.g. Brand New, Slightly Used, Good condition" 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)} 
                    className="mt-1.5 h-12 text-base" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">County *</Label>
                    <select 
                      value={county} 
                      onChange={(e) => setCounty(e.target.value)} 
                      className="w-full h-12 mt-1.5 px-3 rounded-lg border border-input bg-background text-base"
                    >
                      <option value="">Select</option>
                      {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Town / Area</Label>
                    <Input 
                      placeholder="e.g. Westlands" 
                      value={town} 
                      onChange={(e) => setTown(e.target.value)} 
                      className="mt-1.5 h-12 text-base" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Phone *</Label>
                    <Input 
                      placeholder="0712345678" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="mt-1.5 h-12 text-base" 
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">WhatsApp</Label>
                    <Input 
                      placeholder="0712345678" 
                      value={whatsapp} 
                      onChange={(e) => setWhatsapp(e.target.value)} 
                      className="mt-1.5 h-12 text-base" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="h-12 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!title || !county || !phone} className="h-12 flex-1">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Package */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="font-heading font-bold text-lg text-foreground mb-5">Boost Your Ad</h2>
              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <button 
                    key={pkg.id} 
                    onClick={() => setSelectedPackage(pkg.id)} 
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPackage === pkg.id 
                        ? (pkg.id === "gold" ? "border-gold bg-gold/5" : pkg.id === "silver" ? "border-silver bg-silver/5" : "border-primary bg-primary/5") 
                        : "border-border/60 bg-card active:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <pkg.icon className={`w-5 h-5 ${pkg.color}`} />
                        <span className="font-heading font-bold text-sm text-foreground">{pkg.name}</span>
                      </div>
                      <span className={`font-bold text-sm ${pkg.color}`}>{pkg.price}</span>
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
                  <Input 
                    placeholder="0712345678" 
                    value={mpesaPhone} 
                    onChange={(e) => setMpesaPhone(e.target.value)} 
                    className="mt-1.5 h-12 text-base" 
                  />
                  {paymentStatus === "pending" && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Check your phone for M-Pesa prompt...
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="h-12 flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={paymentLoading || (selectedPackage !== "standard" && !mpesaPhone)} 
                  className="h-12 flex-1"
                >
                  {paymentLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
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
