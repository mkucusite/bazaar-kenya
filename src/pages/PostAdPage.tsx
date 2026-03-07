import { useState } from "react";
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
import { Check, Upload, Wand2, ArrowLeft, ArrowRight, Crown, Star, Zap, Loader2 } from "lucide-react";

const STEPS = ["Category", "Photos", "Details", "Package", "Success"];

const PostAdPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 1
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Step 2
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Step 3
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [condition, setCondition] = useState("Used");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Step 4
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="section-padding py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Sign in to Post an Ad</h1>
          <p className="text-muted-foreground mb-6">You need an account to post ads on KenyaAdvert</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/login")}>Sign In</Button>
            <Button variant="outline" onClick={() => navigate("/register")}>Register</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024 && /\.(jpg|jpeg|png|heic)$/i.test(f.name));
    const newPhotos = [...photos, ...valid].slice(0, 15);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (selectedPackage === "standard") {
      await publishAd("standard");
    } else {
      // Trigger M-Pesa payment
      const amount = selectedPackage === "silver" ? 299 : 599;
      setPaymentLoading(true);
      try {
        const result = await initiatePayment({
          phone: mpesaPhone,
          amount,
          package_type: selectedPackage,
          user_id: user.id,
        });
        setPaymentStatus("pending");
        toast({ title: "Check your phone", description: "Enter your M-Pesa PIN to complete payment" });
        
        // Poll for payment status
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
          } catch (e) {
            // Keep polling
          }
        }, 3000);

        setTimeout(() => { clearInterval(interval); setPaymentLoading(false); }, 120000);
      } catch (err: any) {
        setPaymentLoading(false);
        toast({ title: "Payment error", description: err.message, variant: "destructive" });
      }
    }
  };

  const publishAd = async (badge: string) => {
    // Upload images
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
      user_id: user.id,
      title,
      description,
      price: Number(price) || 0,
      is_negotiable: negotiable,
      condition,
      county,
      town,
      phone,
      whatsapp: whatsapp || null,
      images: imageUrls,
      badge,
      status: "active",
    } as any);

    if (error) {
      toast({ title: "Error posting ad", description: error.message, variant: "destructive" });
      return;
    }

    setStep(4);
    setPaymentLoading(false);
    toast({ title: "Ad posted successfully!" });
  };

  const packages = [
    { id: "standard", name: "Standard", price: "FREE", icon: Zap, features: ["Basic listing", "Appears in normal feed", "30 days active"] },
    { id: "silver", name: "Silver", price: "KSh 299", icon: Star, features: ["Silver badge", "3x more engagement", "Randomly appears on page 1", "60 days active"] },
    { id: "gold", name: "Gold", price: "KSh 599", icon: Crown, features: ["GOLD badge", "Gold card design", "6x more engagement", "Homepage featured", "90 days active"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Category */}
          {step === 0 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">What are you selling?</h2>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat.name} className="bg-card rounded-lg border border-border overflow-hidden">
                    <button onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors">
                      <span className={`w-9 h-9 rounded-full ${cat.color} flex items-center justify-center text-lg`}>{cat.icon}</span>
                      <span className="font-medium text-sm text-foreground flex-1 text-left">{cat.name}</span>
                    </button>
                    {expandedCat === cat.name && (
                      <div className="px-4 pb-3 border-t border-border">
                        {cat.subcategories.map((sub) => (
                          <button key={sub} onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(sub); setStep(1); }} className={`w-full text-left text-sm px-3 py-2 rounded hover:bg-muted transition-colors flex items-center justify-between ${selectedSubcategory === sub ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                            {sub}
                            <span className="text-xs text-muted-foreground">1 credit</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Photos */}
          {step === 1 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-2">Add Photos</h2>
              <p className="text-sm text-muted-foreground mb-6">Photos get 5x more customers. Add up to 15 photos.</p>
              <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary transition-colors mb-4">
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Click or drag photos here</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, HEIC — Max 10MB each</p>
                <input type="file" accept=".jpg,.jpeg,.png,.heic" multiple onChange={handlePhotos} className="hidden" />
              </label>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {photoPreviews.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">MAIN</span>}
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={photos.length === 0}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 2 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Tell us about your item</h2>
              <div className="space-y-4">
                <div>
                  <Label>Ad Title</Label>
                  <Input placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                      <Wand2 className="w-3 h-3" /> AI Generate
                    </Button>
                  </div>
                  <Textarea placeholder="Describe your item in detail..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[120px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price (KSh)</Label>
                    <Input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="rounded" />
                      Negotiable
                    </label>
                  </div>
                </div>
                <div>
                  <Label>Condition</Label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-lg border border-input bg-background text-sm">
                    <option>New</option>
                    <option>Used</option>
                    <option>Refurbished</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>County</Label>
                    <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-lg border border-input bg-background text-sm">
                      <option value="">Select County</option>
                      {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Town / Area</Label>
                    <Input placeholder="e.g. Westlands" value={town} onChange={(e) => setTown(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>WhatsApp (optional)</Label>
                    <Input placeholder="0712345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!title || !county || !phone}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 4: Package */}
          {step === 3 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Boost Your Ad</h2>
              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${selectedPackage === pkg.id ? (pkg.id === "gold" ? "border-gold-border bg-gold-light/30" : "border-primary bg-primary/5") : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <pkg.icon className={`w-5 h-5 ${pkg.id === "gold" ? "text-gold" : pkg.id === "silver" ? "text-silver" : "text-primary"}`} />
                        <span className="font-heading font-bold text-foreground">{pkg.name}</span>
                      </div>
                      <span className="font-bold text-primary">{pkg.price}</span>
                    </div>
                    <ul className="space-y-1">
                      {pkg.features.map((f) => (
                        <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Check className="w-3 h-3 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {selectedPackage !== "standard" && (
                <div className="bg-card rounded-xl border border-border p-4 mb-6">
                  <Label>M-Pesa Phone Number</Label>
                  <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="mt-1" />
                  {paymentStatus === "pending" && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Check your phone for M-Pesa prompt...
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={handleSubmit} disabled={paymentLoading || (selectedPackage !== "standard" && !mpesaPhone)}>
                  {paymentLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processing...</> : selectedPackage === "standard" ? "Post Ad" : `Pay & Post`}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 4 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Your ad is now live on KenyaAdvert!</h2>
              <p className="text-muted-foreground mb-8">Thousands of buyers can now see your listing</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/my-ads")}>View My Ads</Button>
                <Button variant="outline" onClick={() => { setStep(0); setTitle(""); setDescription(""); setPrice(""); setPhotos([]); setPhotoPreviews([]); }}>Post Another Ad</Button>
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
