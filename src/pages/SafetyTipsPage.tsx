import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Shield, AlertTriangle, CheckCircle, Phone, MapPin, Eye, CreditCard } from "lucide-react";

const tips = [
  { icon: MapPin, title: "Meet in Public Places", description: "Always arrange to meet buyers or sellers in busy, public locations like shopping malls, police stations, or well-known landmarks. Avoid meeting at private residences." },
  { icon: Eye, title: "Inspect Before Paying", description: "Never pay for an item before you have physically seen and inspected it. If a deal requires advance payment, it could be a scam." },
  { icon: CreditCard, title: "Use M-Pesa for Payments", description: "Whenever possible, use M-Pesa for transactions. It provides a digital trail and is safer than carrying cash." },
  { icon: AlertTriangle, title: "Beware of Too-Good Deals", description: "If a price seems unbelievably low for an item, be cautious. Scammers often lure victims with prices well below market value." },
  { icon: Phone, title: "Verify the Seller", description: "Call the seller before meeting. Ask specific questions about the item. Legitimate sellers will be happy to provide details." },
  { icon: Shield, title: "Trust Your Instincts", description: "If something feels wrong about a transaction, trust your gut and walk away. Your safety is more important than any deal." },
];

const SafetyTipsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-2">Safety Tips</h1>
            <p className="text-muted-foreground text-sm">Stay safe while buying and selling on KenyaAdvert</p>
          </div>

          <div className="space-y-4">
            {tips.map((tip) => (
              <div key={tip.title} className="bg-card border border-border/60 rounded-xl p-5 flex gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <tip.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h3 className="font-heading font-semibold text-foreground">Report Suspicious Activity</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              If you encounter a suspicious listing or seller, use the "Report" button on any ad page. Our moderation team reviews every report within 24 hours. You can also <a href="mailto:support&#64;kenyaadverts.co.ke" className="text-foreground font-medium hover:underline">email our support team</a>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SafetyTipsPage;
