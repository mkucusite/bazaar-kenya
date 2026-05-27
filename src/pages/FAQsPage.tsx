import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExploreLinks from "@/components/ExploreLinks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const faqs = [
  { q: "How do I post an ad on KenyaAdvert?", a: "Click the green 'Sell' button at the top of any page, choose the most relevant category and subcategory for your item, add at least three clear photos taken in good light, write a detailed description of 80 words or more covering condition, features and what's included, set your price in Kenya shillings, add your county, town and contact phone or WhatsApp, then choose a package — Standard is completely free. Your ad goes live the moment you publish." },
  { q: "Is it free to post ads on KenyaAdvert?", a: "Yes — Standard ads are 100% free for every user, every category, every county in Kenya. You only pay if you want extra visibility through our Silver (KSh 299) or Gold (KSh 599) packages, which place your listing higher in search results, add a coloured badge and keep your ad active for longer. Free listings still appear in search and category pages and reach the full audience." },
  { q: "How do I pay for premium packages and credit bundles?", a: "Every paid transaction on KenyaAdvert is processed through M-Pesa via PayHero. When you choose a package or a credit bundle, enter the M-Pesa phone number that should be charged and tap continue. You'll receive an STK push on your phone within seconds — just enter your M-Pesa PIN to approve. Once payment is confirmed we activate your boost or top up your credits automatically. You'll also get an M-Pesa SMS receipt for your records." },
  { q: "What are credits and how do they work?", a: "Credits are the currency used to publish ads in some categories. Each ad you post costs one credit. You can buy bundles starting from KSh 5 for 5 credits and going up to bigger packs with discounts. Credits never expire and can be used across any category whenever you're ready to list. Your current credit balance is shown on the post-ad page and inside your dashboard at any time." },
  { q: "How do I contact a seller after I find an ad I like?", a: "Every ad page in KenyaAdvert shows three contact options: Call, WhatsApp and in-app Chat. Use whichever the seller answers fastest — Call is best for urgent items like rentals and vehicles, WhatsApp is good for sending follow-up questions and pictures, and Chat keeps a record inside KenyaAdvert in case you need it later. We never share your phone number until you choose to reveal it." },
  { q: "How do I stay safe when buying or selling in Kenya?", a: "Always meet in a busy public place such as a shopping mall, fuel station or near a police post. Never send full payment before you have physically seen the item. Use M-Pesa rather than cash so the transaction leaves a digital trail. Be cautious of prices that look far below market — that is the classic scam signal. Read the full Safety Tips page for the complete checklist and report any suspicious ad with the Report button." },
  { q: "Can I edit, boost or delete my ad after posting?", a: "Yes — full control. Go to your dashboard, open 'My Ads' and you'll see every listing you've ever posted. From there you can edit photos, price and description, mark items as sold, delete the ad, boost it to Silver or Gold with M-Pesa, or renew it once it expires. Edits go live immediately and changes to price or photos do not reset your ad's age in search results." },
  { q: "How long does my ad stay active on KenyaAdvert?", a: "Standard ads stay live for 30 days, Silver ads stay live for 60 days and Gold ads stay live for 90 days. Seven days before expiry we send you an email and an in-app notification so you can renew with one tap. Renewing keeps your photos, description and contact details — only the expiry date resets — and a renewed ad is treated as freshly posted by our search ranking." },
  { q: "How do I set up keyword alerts for ads I'm looking for?", a: "Open 'Manage Alerts' from your dashboard, type the keywords you want to track (for example 'Toyota Probox Nairobi' or 'bedsitter Kasarani'), pick the category and county you care about and save. The moment a new ad matching your keywords is posted we send you a push notification, an email and an in-app alert so you can be the first buyer to contact the seller." },
  { q: "How do I report a suspicious ad or seller?", a: "Open the listing, scroll to the bottom and tap 'Report This Ad'. Choose a reason — scam, fake item, prohibited content, abusive seller and so on — and add any details that help. Our Gemini-powered moderation system reviews every report within minutes and our human team double-checks within 24 hours. Confirmed bad ads are hidden immediately and the seller account is reviewed. Your report is anonymous to the seller." },
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
