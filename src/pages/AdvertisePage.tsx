import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Loader2, BarChart3, Users, Star } from "lucide-react";

const packages = [
  {
    id: "basic_banner",
    name: "Basic Banner",
    price: "KSh 2,000/month",
    icon: BarChart3,
    features: [
      "Banner ad displayed on homepage",
      "Visible across desktop and mobile",
      "Up to 50,000 impressions per month",
      "Link to your website or listing",
      "Performance report at month end",
    ],
  },
  {
    id: "featured_business",
    name: "Featured Business",
    price: "KSh 5,000/month",
    icon: Star,
    popular: true,
    features: [
      "Everything in Basic Banner",
      "Featured on homepage carousel",
      "Gold star badge on your profile",
      "Priority in search results",
      "Business profile highlighted",
      "Monthly analytics report",
    ],
  },
  {
    id: "category_sponsor",
    name: "Category Sponsor",
    price: "KSh 8,000/month",
    icon: Users,
    features: [
      "Everything in Featured Business",
      "Exclusive sponsor of one category",
      "Your logo at top of category page",
      "'Sponsored by' branding label",
      "All ads boosted within category",
      "Dedicated account manager",
    ],
  },
];

const AdvertisePage = () => {
  const [form, setForm] = useState({
    business_name: "",
    contact_person: "",
    phone: "",
    email: "",
    preferred_package: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.business_name || !form.contact_person || !form.phone || !form.email || !form.preferred_package) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("advertiser_requests" as any)
      .insert(form as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error submitting application", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Application submitted successfully" });
    }
  };

  return (
    <>
      <SEOHead
        title="Advertise With Us"
        description="Reach thousands of buyers across Kenya. Explore our advertising packages for banner ads, featured business listings, and category sponsorships on KenyaAdvert."
        keywords="advertise Kenya, banner ads Kenya, digital advertising Kenya, KenyaAdvert advertising"
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-primary/5 border-b border-border py-12 md:py-16">
          <div className="container-app max-w-3xl text-center">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Advertise With Us
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Reach thousands of active buyers and sellers across all 47 counties in Kenya.
              Choose a package that fits your business goals.
            </p>
          </div>
        </section>

        {/* Packages */}
        <section className="container-app max-w-5xl py-10 md:py-14">
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-xl border p-6 flex flex-col transition-shadow hover:shadow-lg ${
                  pkg.popular
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card"
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Most Popular
                  </span>
                )}
                <pkg.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                <p className="text-2xl font-bold text-foreground mt-1 mb-4">{pkg.price}</p>
                <ul className="space-y-2 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={pkg.popular ? "default" : "outline"}
                  onClick={() => {
                    setForm((f) => ({ ...f, preferred_package: pkg.id }));
                    document.getElementById("apply-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Choose {pkg.name}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Application Form */}
        <section id="apply-form" className="container-app max-w-2xl pb-14">
          <div className="bg-card rounded-xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">Apply to Advertise</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Fill in the form below and our team will get back to you within 24 hours.
            </p>

            {submitted ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">Application Received</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for your interest. Our team will review your application and contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="biz_name">Business Name *</Label>
                    <Input
                      id="biz_name"
                      value={form.business_name}
                      onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Person *</Label>
                    <Input
                      id="contact"
                      value={form.contact_person}
                      onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adv_phone">Phone Number *</Label>
                    <Input
                      id="adv_phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+254..."
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="adv_email">Email *</Label>
                    <Input
                      id="adv_email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Preferred Package *</Label>
                  <Select
                    value={form.preferred_package}
                    onValueChange={(val) => setForm((f) => ({ ...f, preferred_package: val }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic_banner">Basic Banner - KSh 2,000/mo</SelectItem>
                      <SelectItem value="featured_business">Featured Business - KSh 5,000/mo</SelectItem>
                      <SelectItem value="category_sponsor">Category Sponsor - KSh 8,000/mo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adv_msg">Message (optional)</Label>
                  <Textarea
                    id="adv_msg"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us about your advertising goals..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit Application
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AdvertisePage;
