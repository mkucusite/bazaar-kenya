import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExploreLinks from "@/components/ExploreLinks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const faqs = [
  { q: "How do I post an ad on KenyaAdvert?", a: "Click the green 'Sell' button, choose a category, add photos and details, then select a package. Standard ads are free!" },
  { q: "Is it free to post ads?", a: "Yes! Standard ads are completely free. You can upgrade to Silver (KSh 299) or Gold (KSh 599) for more visibility." },
  { q: "How do I pay for premium packages?", a: "We use M-Pesa via PayHero. When you select a paid package, enter your M-Pesa phone number and approve the STK push on your phone." },
  { q: "What are credits?", a: "Credits are used to post ads. Each ad costs 1 credit. You can buy credit bundles starting from KSh 5 for 5 credits." },
  { q: "How do I contact a seller?", a: "Each ad has Call, WhatsApp, and Chat buttons. Use the one that's most convenient for you." },
  { q: "How do I stay safe when buying or selling?", a: "Always meet in public places, never pay before seeing an item, use M-Pesa for traceable payments, and report suspicious ads." },
  { q: "Can I edit my ad after posting?", a: "Yes! Go to 'Manage My Ads' in your dashboard to edit, delete, boost, or renew any of your ads." },
  { q: "How long does my ad stay active?", a: "Standard ads are active for 30 days, Silver for 60 days, and Gold for 90 days." },
  { q: "How do I set up alerts?", a: "Go to 'Manage Alerts' and create keyword-based alerts. You'll be notified when matching ads are posted." },
  { q: "How do I report a suspicious ad?", a: "Click the 'Report This Ad' button at the bottom of any ad page. Our team reviews all reports within 24 hours." },
];

const FAQsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="FAQs — Frequently Asked Questions" description="Get answers about posting ads, payments, credits, and safety on KenyaAdvert. Everything you need to know about buying and selling." canonical="https://www.kenyaadverts.com/faqs" ogImage="https://www.kenyaadverts.com/og/og-faqs.png" keywords="FAQs KenyaAdvert, help center, how to post ad Kenya, M-Pesa payment help, credits explained, classified ad help, seller questions Kenya, buyer FAQ, how to sell on KenyaAdvert, how to buy on KenyaAdvert, ad posting guide, safety questions, report ad, premium packages, boost ad help" />
      <Navbar />
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">FAQs</h1>
              <p className="text-muted-foreground text-xs">Everything you need to know about KenyaAdvert</p>
            </div>
          </div>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border/60 px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <ExploreLinks />
      <Footer />
    </div>
  );
};

export default FAQsPage;
