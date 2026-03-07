import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
      <Navbar />
      <div className="section-padding py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground text-sm mb-8">Everything you need to know about KenyaAdvert</p>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-border px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQsPage;
