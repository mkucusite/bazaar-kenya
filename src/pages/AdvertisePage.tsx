import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Loader2,
  BarChart3,
  Users,
  Star,
  Upload,
  ArrowRight,
  ArrowLeft,
  ImageIcon,
} from "lucide-react";
import { compressImage } from "@/lib/image-compress";
import { slugifyAdTitle } from "@/lib/ad-links";

const SITE_URL = "https://www.kenyaadverts.co.ke";

const packages = [
  {
    id: "basic_banner",
    name: "Basic Banner",
    price: 2000,
    priceLabel: "KSh 2,000/month",
    icon: BarChart3,
    position: "homepage_top",
    features: [
      "Banner displayed on homepage",
      "Visible on desktop and mobile",
      "Up to 50,000 impressions",
      "Link to your website or listing",
      "Performance stats in dashboard",
    ],
  },
  {
    id: "featured_business",
    name: "Featured Business",
    price: 5000,
    priceLabel: "KSh 5,000/month",
    icon: Star,
    popular: true,
    position: "search_results",
    features: [
      "Everything in Basic Banner",
      "Featured on search results",
      "Gold star badge on profile",
      "Priority placement",
      "Monthly analytics",
    ],
  },
  {
    id: "category_sponsor",
    name: "Category Sponsor",
    price: 8000,
    priceLabel: "KSh 8,000/month",
    icon: Users,
    position: "category_top",
    features: [
      "Everything in Featured Business",
      "Exclusive sponsor of a category",
      "Logo at top of category page",
      "'Sponsored by' branding",
      "All ads boosted in category",
    ],
  },
];

type Step = "package" | "details" | "payment" | "success";

const AdvertisePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("package");
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [targetUrlMode, setTargetUrlMode] = useState<"homepage" | "ad" | "custom">("homepage");
  const [selectedAdSlug, setSelectedAdSlug] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [userAds, setUserAds] = useState<{ slug: string; title: string }[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [paying, setPaying] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [campaignId, setCampaignId] = useState("");

  useEffect(() => {
    return () => { if (pollTimer) clearInterval(pollTimer); };
  }, [pollTimer]);

  // Fetch user's own active ads for quick pick
  useEffect(() => {
    if (!user) return;
    supabase
      .from("ads")
      .select("slug,title")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setUserAds((data as any[]).filter((a) => a.slug));
      });
  }, [user]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const pkg = packages.find((p) => p.id === selectedPkg);

  // Compute final target URL based on mode
  const getTargetUrl = () => {
    if (targetUrlMode === "ad" && selectedAdSlug) {
      return `${SITE_URL}/ads/${selectedAdSlug}`;
    }
    if (targetUrlMode === "custom" && customUrl.trim()) {
      const url = customUrl.trim();
      return url.startsWith("http") ? url : `https://${url}`;
    }
    // Default: homepage
    return SITE_URL;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSelectPackage = (pkgId: string) => {
    if (!user) {
      toast({ title: "Please sign in to create a campaign", variant: "destructive" });
      navigate("/login");
      return;
    }
    setSelectedPkg(pkgId);
    setStep("details");
  };

  const handleDetailsSubmit = () => {
    if (!businessName.trim()) {
      toast({ title: "Enter your business name", variant: "destructive" });
      return;
    }
    if (targetUrlMode === "ad" && !selectedAdSlug) {
      toast({ title: "Select one of your ads", variant: "destructive" });
      return;
    }
    if (targetUrlMode === "custom" && !customUrl.trim()) {
      toast({ title: "Enter a destination URL", variant: "destructive" });
      return;
    }
    if (!bannerFile) {
      toast({ title: "Upload a banner image", variant: "destructive" });
      return;
    }
    setStep("payment");
  };

  const handlePay = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      toast({ title: "Enter a valid M-Pesa phone number", variant: "destructive" });
      return;
    }
    if (!pkg || !user) return;

    setPaying(true);
    try {
      // 1. Upload banner with progress
      setUploading(true);
      setUploadProgress(10);
      const compressed = await compressImage(bannerFile!);
      setUploadProgress(40);
      const ext = bannerFile!.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("banners").upload(path, compressed);
      if (uploadErr) throw uploadErr;
      setUploadProgress(80);
      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);
      const bannerUrl = urlData.publicUrl;
      setUploadProgress(100);
      setUploading(false);

      const finalTargetUrl = getTargetUrl();

      // 2. Create campaign record
      const { data: campaign, error: campErr } = await supabase
        .from("banner_campaigns" as any)
        .insert({
          user_id: user.id,
          package_type: pkg.id,
          banner_image: bannerUrl,
          target_url: finalTargetUrl,
          business_name: businessName.trim(),
          position: pkg.position,
          amount_paid: pkg.price,
          status: "pending_payment",
        } as any)
        .select("id")
        .single();
      if (campErr) throw campErr;
      const campId = (campaign as any).id;
      setCampaignId(campId);

      // 3. Initiate M-Pesa payment
      const result = await initiatePayment({
        phone: phone.trim(),
        amount: pkg.price,
        package_type: `banner_${pkg.id}`,
        user_id: user.id,
      });

      if (!result?.transaction_id) throw new Error("Payment initiation failed");

      toast({ title: "M-Pesa prompt sent. Enter your PIN on your phone." });

      // 4. Poll for payment confirmation
      let attempts = 0;
      const timer = setInterval(async () => {
        attempts++;
        try {
          const verification = await verifyPayment(result.transaction_id);
          if (verification?.status === "completed") {
            clearInterval(timer);
            // Activate campaign
            const starts = new Date();
            const ends = new Date(starts.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            await supabase
              .from("banner_campaigns" as any)
              .update({
                status: "active",
                payment_id: verification.payment_id || null,
                starts_at: starts.toISOString(),
                ends_at: ends.toISOString(),
              } as any)
              .eq("id", campId);
            setPaying(false);
            setStep("success");
            toast({ title: "Payment confirmed. Your campaign is live!" });
          } else if (verification?.status === "failed") {
            clearInterval(timer);
            await supabase.from("banner_campaigns" as any).update({ status: "payment_failed" } as any).eq("id", campId);
            setPaying(false);
            toast({ title: "Payment failed. Please try again.", variant: "destructive" });
          } else if (attempts >= 20) {
            clearInterval(timer);
            setPaying(false);
            toast({ title: "Payment timeout. Check My Campaigns for status.", variant: "destructive" });
          }
        } catch {
          if (attempts >= 20) {
            clearInterval(timer);
            setPaying(false);
          }
        }
      }, 3000);
      setPollTimer(timer);
    } catch (err: any) {
      console.error("Campaign payment error:", err);
      setPaying(false);
      setUploading(false);
      setUploadProgress(0);
      toast({ title: err.message || "Something went wrong", variant: "destructive" });
    }
  };

  return (
    <>
      <SEOHead
        title="Advertise With Us — KenyaAdvert"
        description="Promote your business to thousands of Kenyan buyers with banner ads on KenyaAdvert."
        canonical="https://www.kenyaadverts.co.ke/advertise"
        ogImage="https://www.kenyaadverts.co.ke/og/og-post-ad.png"
      />
      <Navbar />
      <main className="min-h-screen bg-background py-6 md:py-10">
        <div className="container-app">
          {/* STEP 1: Package Selection */}
          {step === "package" && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">Advertise on KenyaAdvert</h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Get your business in front of thousands of buyers. Choose a package and launch your campaign in minutes.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {packages.map((p) => (
                  <div
                    key={p.id}
                    className={`relative bg-card rounded-xl border p-6 flex flex-col ${p.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  >
                    {p.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                    <p.icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                    <p className="text-2xl font-bold text-foreground mt-1 mb-4">{p.priceLabel}</p>
                    <ul className="space-y-2 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-6 w-full"
                      variant={p.popular ? "default" : "outline"}
                      onClick={() => handleSelectPackage(p.id)}
                    >
                      Get Started
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP 2: Campaign Details */}
          {step === "details" && pkg && (
            <div className="max-w-xl mx-auto">
              <button onClick={() => setStep("package")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to packages
              </button>
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-1">Campaign Details</h2>
                <p className="text-sm text-muted-foreground mb-6">Package: <strong>{pkg.name}</strong> — {pkg.priceLabel}</p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bizName">Business Name *</Label>
                    <Input id="bizName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business or brand name" className="mt-1" />
                  </div>

                  {/* Target URL - radio options */}
                  <div>
                    <Label>Where should the banner link to? *</Label>
                    <div className="mt-2 space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${targetUrlMode === "homepage" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="urlMode" checked={targetUrlMode === "homepage"} onChange={() => setTargetUrlMode("homepage")} className="accent-[hsl(var(--primary))]" />
                        <div>
                          <p className="text-sm font-medium text-foreground">KenyaAdvert Homepage</p>
                          <p className="text-xs text-muted-foreground">kenyaadverts.co.ke</p>
                        </div>
                      </label>

                      {userAds.length > 0 && (
                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${targetUrlMode === "ad" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                          <input type="radio" name="urlMode" checked={targetUrlMode === "ad"} onChange={() => setTargetUrlMode("ad")} className="accent-[hsl(var(--primary))] mt-1" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">One of my ads</p>
                            {targetUrlMode === "ad" && (
                              <Select value={selectedAdSlug} onValueChange={setSelectedAdSlug}>
                                <SelectTrigger className="h-9 text-xs mt-2">
                                  <SelectValue placeholder="Select an ad" />
                                </SelectTrigger>
                                <SelectContent>
                                  {userAds.map((ad) => (
                                    <SelectItem key={ad.slug} value={ad.slug} className="text-xs">{ad.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </label>
                      )}

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${targetUrlMode === "custom" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <input type="radio" name="urlMode" checked={targetUrlMode === "custom"} onChange={() => setTargetUrlMode("custom")} className="accent-[hsl(var(--primary))] mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">Custom website URL</p>
                          {targetUrlMode === "custom" && (
                            <Input
                              value={customUrl}
                              onChange={(e) => setCustomUrl(e.target.value)}
                              placeholder="https://yourbusiness.co.ke"
                              className="mt-2 h-9 text-xs"
                            />
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Banner upload */}
                  <div>
                    <Label>Banner Image *</Label>
                    <p className="text-xs text-muted-foreground mb-2">Recommended size: 1200 × 300px (4:1 ratio). JPG or PNG.</p>
                    {bannerPreview ? (
                      <div className="relative">
                        <img src={bannerPreview} alt="Banner preview" className="w-full rounded-lg border border-border object-cover max-h-48" />
                        <button
                          onClick={() => { setBannerFile(null); setBannerPreview(""); }}
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-destructive/20 transition-colors"
                        >
                          <span className="text-xs text-destructive font-medium px-1">Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload banner</span>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <Button onClick={handleDetailsSubmit} className="w-full gap-2">
                    Continue to Payment <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === "payment" && pkg && (
            <div className="max-w-md mx-auto">
              <button onClick={() => setStep("details")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to details
              </button>
              <div className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Pay via M-Pesa</h2>
                <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium text-foreground">{pkg.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">30 days</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg">KSh {pkg.price.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                  <Input
                    id="mpesaPhone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="mt-1"
                    disabled={paying}
                  />
                </div>

                {/* Upload progress bar */}
                {paying && uploading && (
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading banner...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <Button onClick={handlePay} disabled={paying} className="w-full gap-2">
                  {paying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploading ? "Uploading banner..." : "Waiting for M-Pesa..."}
                    </>
                  ) : (
                    <>Pay KSh {pkg.price.toLocaleString()} via M-Pesa</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  You will receive an STK push prompt on your phone. Enter your M-Pesa PIN to confirm.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === "success" && (
            <div className="max-w-md mx-auto text-center py-10">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Campaign is Live!</h2>
              <p className="text-muted-foreground mb-6">
                Your banner ad is now active and will be displayed across KenyaAdvert for the next 30 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/my-campaigns")}>View My Campaigns</Button>
                <Button variant="outline" onClick={() => { setStep("package"); setSelectedPkg(""); setBannerFile(null); setBannerPreview(""); setBusinessName(""); setTargetUrlMode("homepage"); setSelectedAdSlug(""); setCustomUrl(""); }}>
                  Create Another Campaign
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AdvertisePage;