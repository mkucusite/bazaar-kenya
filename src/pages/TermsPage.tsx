import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Terms of Service — KenyaAdvert" description="Read the terms of service for KenyaAdvert. Understand the rules and guidelines for buying and selling on Kenya's trusted classifieds marketplace." canonical="https://www.kenyaadverts.com/terms" ogImage="https://www.kenyaadverts.com/og/og-terms.png" keywords="terms of service KenyaAdvert, user agreement Kenya classifieds, rules classifieds Kenya, KenyaAdvert terms, platform guidelines, buying rules Kenya, selling terms Kenya" />
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-3xl mx-auto prose prose-sm prose-foreground">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-6">Terms of Service</h1>
          <p className="text-muted-foreground text-sm mb-4"><strong>Last updated:</strong> March 2026</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using KenyaAdvert (kenyaadverts.com), you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">2. Platform Description</h2>
              <p>KenyaAdvert is an online classifieds marketplace that connects buyers and sellers across Kenya. We do not own, sell, or buy any items listed on the platform. We serve as an intermediary to facilitate transactions between users.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">3. User Accounts</h2>
              <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use this service.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">4. Listing Guidelines</h2>
              <p>Users must not post illegal items, counterfeit goods, stolen property, weapons, drugs, or any content that violates Kenyan law. KenyaAdvert reserves the right to remove any listing that violates these guidelines without notice.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">5. Payments & Credits</h2>
              <p>Premium listing packages (Gold, Silver) require payment via M-Pesa. All payments are non-refundable once a listing has been published. Credits purchased on the platform have no cash value and cannot be transferred.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">6. Limitation of Liability</h2>
              <p>KenyaAdvert is not responsible for the quality, safety, or legality of items listed. We are not liable for any disputes, losses, or damages arising from transactions between users. Users transact at their own risk.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">7. Contact</h2>
              <p>For questions about these terms, <a href="mailto:support&#64;kenyaadverts.com" className="text-primary hover:underline">contact our support team</a>.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
