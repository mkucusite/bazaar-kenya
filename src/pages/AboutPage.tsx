import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ExploreLinks from "@/components/ExploreLinks";
import { Users, Target, Heart, MapPin, Shield, Zap } from "lucide-react";
import LogoImage from "@/components/LogoImage";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="About KenyaAdvert — Kenya's Trusted Classifieds" description="Learn about KenyaAdvert, Kenya's trusted classifieds marketplace connecting buyers and sellers across all 47 counties." canonical="https://www.kenyaadverts.com/about" ogImage="https://www.kenyaadverts.com/og/og-about.png" keywords="about KenyaAdvert, Kenya classifieds marketplace, online marketplace Kenya, who is KenyaAdvert, Kenya buy sell platform, trusted classifieds Kenya, Kenyan marketplace, 47 counties classifieds, safe online trading Kenya, KenyaAdvert mission, verified sellers Kenya, AI-powered classifieds, free ad posting Kenya, Nairobi online marketplace" />
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <LogoImage alt="KenyaAdvert" className="h-20 mx-auto mb-4" />
            <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-3">About KenyaAdvert</h1>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto leading-relaxed">
              Kenya's own classifieds marketplace — built by Kenyans, for Kenyans. We connect buyers and sellers across all 47 counties with a safe, fast, and trusted platform.
            </p>
          </div>

          {/* Story */}
          <div className="prose prose-sm md:prose-base max-w-none mb-10 text-muted-foreground leading-relaxed space-y-4">
            <p>
              <strong className="text-foreground">KenyaAdvert</strong> was founded in 2023 with a simple goal: give every Kenyan a free, safe and modern place to buy and sell online. From the matatu driver in Nairobi selling spare parts to the farmer in Kakamega listing dairy cows, from the student in Eldoret renting out a bedsitter to the tech professional in Mombasa upgrading their laptop — we built KenyaAdvert so that anyone with a phone and an M-Pesa line can reach buyers across the whole country.
            </p>
            <p>
              Today the platform serves all <strong className="text-foreground">47 counties</strong> of Kenya. We host tens of thousands of active listings spanning vehicles, electronics, property rentals and sales, jobs, services, building supplies, fashion, home goods, agriculture and digital products. Our team is based in Nairobi and works daily with sellers, business owners, political campaigns and event organisers to help them reach more Kenyans online.
            </p>
            <p>
              What makes KenyaAdvert different is the focus on <strong className="text-foreground">trust and safety</strong>. Every listing is scanned by our Gemini-powered AI moderation system, every business profile can earn a verified badge, every payment runs on M-Pesa via PayHero for a fully traceable trail, and every page is built for mobile-first browsing so the platform works on the same phones most Kenyans actually use.
            </p>
            <p>
              You can reach us at <a href="mailto:support&#64;kenyaadverts.com" className="text-primary font-medium hover:underline">support@kenyaadverts.com</a> for anything — partnerships, advertising, safety reports, press enquiries or help posting your first ad. We read every message and reply within one working day.
            </p>
          </div>



          {/* Mission */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-card border border-border/60 rounded-xl p-5">
              <Target className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-2">Our Mission</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To make buying and selling accessible to every Kenyan, from Nairobi to the most remote counties. We believe everyone deserves a trusted platform to trade.
              </p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-5">
              <Heart className="w-8 h-8 text-destructive mb-3" />
              <h3 className="font-heading font-semibold text-foreground mb-2">Our Values</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Trust, transparency, and community. Every feature we build aims to create safer transactions and better connections between Kenyans.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Counties Covered", value: "47" },
              { label: "Active Listings", value: "10K+" },
              { label: "Registered Users", value: "50K+" },
              { label: "Daily Transactions", value: "500+" },
            ].map((s) => (
              <div key={s.label} className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Why choose us */}
          <h2 className="font-heading text-xl text-foreground mb-4">Why Choose KenyaAdvert?</h2>
          <div className="space-y-3 mb-8">
            {[
              { icon: Zap, title: "Free to Post", desc: "List your items at no cost. We believe in making the marketplace accessible." },
              { icon: Shield, title: "AI-Powered Safety", desc: "Our Gemini AI automatically screens listings to protect buyers from scams and fraud." },
              { icon: MapPin, title: "Hyper-Local", desc: "Filter by county and town to find deals near you. We cover every corner of Kenya." },
              { icon: Users, title: "Verified Sellers", desc: "Business profiles with verification badges so you know who you're dealing with." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 bg-card border border-border/60 rounded-xl p-4">
                <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-muted/50 border border-border/60 rounded-xl p-6 text-center">
            <h3 className="font-heading font-semibold text-foreground mb-2">Get In Touch</h3>
            <p className="text-sm text-muted-foreground mb-1"><a href="mailto:support&#64;kenyaadverts.com" className="hover:text-foreground transition-colors">Email Us</a></p>
            <p className="text-sm text-muted-foreground">Based in Nairobi, Kenya</p>
          </div>
        </div>
      </div>
      <ExploreLinks />
      <Footer />
    </div>
  );
};

export default AboutPage;
