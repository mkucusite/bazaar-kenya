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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [condition, setCondition] = useState("Used");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-20 text-center">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-3">Sign in to Post an Ad</h1>
          <p className="text-muted-foreground text-sm mb-6">You need an account to post ads on KenyaAdvert</p>
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
      condition, county, town, phone, whatsapp: whatsapp || null, images: imageUrls, badge, status: "active",
    } as any);
    if (error) { toast({ title: "Error posting ad", description: error.message, variant: "destructive" }); return; }
    setStep(4);
    setPaymentLoading(false);
    toast({ title: "Ad posted successfully!" });
  };

  const packages = [
    { id: "standard", name: "Standard", price: "FREE", icon: Zap, features: ["Basic listing", "Appears in normal feed", "30 days active"] },
    { id: "silver", name: "Silver", price: "KSh 299", icon: Star, features: ["Silver badge", "3x more engagement", "Page 1 boost", "60 days active"] },
    { id: "gold", name: "Gold", price: "KSh 599", icon: Crown, features: ["GOLD badge", "Gold card design", "6x engagement", "Homepage featured", "90 days active"] },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                    i < step ? "bg-primary text-primary-foreground" : 
                    i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : 
                    "bg-muted text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1.5 rounded ${i < step ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground px-1">
              {STEPS.map((s) => <span key={s}>{s}</span>)}
            </div>
          </div>

          {/* Step 1 */}
          {step === 0 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-5">What are you selling?</h2>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <div key={cat.name} className="bg-card rounded-xl border border-border/60 overflow-hidden">
                    <button onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <span className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center text-sm`}>{cat.icon}</span>
                      <span className="font-medium text-sm text-foreground flex-1 text-left">{cat.name}</span>
                    </button>
                    {expandedCat === cat.name && (
                      <div className="px-4 pb-3 border-t border-border/40">
                        {cat.subcategories.map((sub) => (
                          <button key={sub} onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(sub); setStep(1); }} className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between text-muted-foreground hover:text-foreground">
                            {sub}
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">1 credit</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-2">Add Photos</h2>
              <p className="text-xs text-muted-foreground mb-5">Photos get 5x more customers. Add up to 15 photos.</p>
              <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors mb-4">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click or drag photos here</p>
                <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, HEIC — Max 10MB each</p>
                <input type="file" accept=".jpg,.jpeg,.png,.heic" multiple onChange={handlePhotos} className="hidden" />
              </label>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {photoPreviews.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border/60">
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold">MAIN</span>}
                      <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">x</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="h-9"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(2)} disabled={photos.length === 0} className="h-9">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 2 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-5">Tell us about your item</h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Ad Title</Label>
                  <Input placeholder="e.g. Samsung Galaxy S24 Ultra 256GB" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 h-10" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Description</Label>
                    <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary h-7"><Wand2 className="w-3 h-3" /> AI Generate</Button>
                  </div>
                  <Textarea placeholder="Describe your item in detail..." value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Price (KSh)</Label>
                    <Input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1.5 h-10" />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input type="checkbox" checked={negotiable} onChange={(e) => setNegotiable(e.target.checked)} className="rounded" />
                      Negotiable
                    </label>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Condition</Label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-10 mt-1.5 px-3 rounded-lg border border-input bg-background text-sm">
                    <option>New</option><option>Used</option><option>Refurbished</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">County</Label>
                    <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-10 mt-1.5 px-3 rounded-lg border border-input bg-background text-sm">
                      <option value="">Select County</option>
                      {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Town / Area</Label>
                    <Input placeholder="e.g. Westlands" value={town} onChange={(e) => setTown(e.target.value)} className="mt-1.5 h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input placeholder="0712345678" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-10" />
                  </div>
                  <div>
                    <Label className="text-xs">WhatsApp (optional)</Label>
                    <Input placeholder="0712345678" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1.5 h-10" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="h-9"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setStep(3)} disabled={!title || !county || !phone} className="h-9">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 3 && (
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground mb-5">Boost Your Ad</h2>
              <div className="space-y-3 mb-6">
                {packages.map((pkg) => (
                  <button key={pkg.id} onClick={() => setSelectedPackage(pkg.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedPackage === pkg.id ? (pkg.id === "gold" ? "border-gold-border bg-gold-light/40" : "border-primary bg-primary/5") : "border-border/60 bg-card hover:border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <pkg.icon className={`w-5 h-5 ${pkg.id === "gold" ? "text-gold" : pkg.id === "silver" ? "text-silver" : "text-primary"}`} />
                        <span className="font-heading font-bold text-sm text-foreground">{pkg.name}</span>
                      </div>
                      <span className="font-bold text-sm text-primary">{pkg.price}</span>
                    </div>
                    <ul className="space-y-1">
                      {pkg.features.map((f) => (
                        <li key={f} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-primary flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              {selectedPackage !== "standard" && (
                <div className="bg-card rounded-xl border border-border/60 p-4 mb-6">
                  <Label className="text-xs">M-Pesa Phone Number</Label>
                  <Input placeholder="0712345678" value={mpesaPhone} onChange={(e) => setMpesaPhone(e.target.value)} className="mt-1.5 h-10" />
                  {paymentStatus === "pending" && (
                    <div className="flex items-center gap-2 mt-3 text-xs text-primary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Check your phone for M-Pesa prompt...
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="h-9"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={handleSubmit} disabled={paymentLoading || (selectedPackage !== "standard" && !mpesaPhone)} className="h-9">
                  {paymentLoading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Processing...</> : selectedPackage === "standard" ? "Post Ad" : "Pay & Post"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 4 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Your ad is now live!</h2>
              <p className="text-muted-foreground text-sm mb-8">Thousands of buyers can now see your listing</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/my-ads")}>View My Ads</Button>
                <Button variant="outline" onClick={() => { setStep(0); setPhotos([]); setPhotoPreviews([]); }}>Post Another</Button>
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
