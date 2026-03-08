import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import { Users, Target, Heart, MapPin, Shield, Zap } from "lucide-react";
import logo from "@/assets/kenyaadvert-logo.png";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="About KenyaAdvert — Kenya's Trusted Classifieds" description="Learn about KenyaAdvert, Kenya's trusted classifieds marketplace connecting buyers and sellers across all 47 counties." canonical="https://www.kenyaadverts.co.ke/about" ogImage="https://www.kenyaadverts.co.ke/og/og-about.png" keywords="about KenyaAdvert, Kenya classifieds marketplace, online marketplace Kenya, who is KenyaAdvert, Kenya buy sell platform, trusted classifieds Kenya, Kenyan marketplace, 47 counties classifieds, safe online trading Kenya, KenyaAdvert mission, verified sellers Kenya, AI-powered classifieds, free ad posting Kenya, Nairobi online marketplace" />
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <img src={logo} alt="KenyaAdvert" className="h-20 mx-auto mb-4" />
            <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-3">About KenyaAdvert</h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
              Kenya's own classifieds marketplace — built by Kenyans, for Kenyans. We connect buyers and sellers across all 47 counties with a safe, fast, and trusted platform.
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
            <p className="text-sm text-muted-foreground mb-1"><a href="mailto:support&#64;kenyaadverts.co.ke" className="hover:text-foreground transition-colors">Email Us</a></p>
            <p className="text-sm text-muted-foreground">Based in Nairobi, Kenya</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
