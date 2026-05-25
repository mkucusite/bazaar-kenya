import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Privacy Policy — KenyaAdvert" description="Read KenyaAdvert's privacy policy. Learn how we collect, use, and protect your personal information on Kenya's trusted classifieds marketplace." canonical="https://www.kenyaadverts.com/privacy" ogImage="https://www.kenyaadverts.com/og/og-privacy.png" keywords="privacy policy KenyaAdvert, data protection Kenya, personal information classifieds, user privacy Kenya, GDPR Kenya, data security, KenyaAdvert privacy, how we use your data" />
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-5xl mx-auto prose prose-sm prose-foreground">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mb-4"><strong>Last updated:</strong> March 2026</p>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">1. Information We Collect</h2>
              <p>We collect information you provide when registering (name, email, phone number), listing ads (photos, descriptions, location), and using the platform (search queries, page views). We also collect device information and IP addresses for security purposes.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">2. How We Use Your Information</h2>
              <p>We use your data to: provide and improve our services, display your listings to potential buyers, send notifications about your ads and account, prevent fraud and abuse, and comply with Kenyan data protection laws.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">3. Information Sharing</h2>
              <p>Your phone number is visible to potential buyers on your listings. We do not sell your personal data to third parties. We may share information with law enforcement when required by Kenyan law.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">4. Data Security</h2>
              <p>We use encryption and secure cloud infrastructure to protect your data. However, no system is 100% secure. We recommend using strong passwords and not sharing your account credentials.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">5. Cookies</h2>
              <p>We use cookies and local storage to remember your preferences (theme, search history) and keep you logged in. You can disable cookies in your browser, but some features may not work properly.</p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground mb-2">6. Your Rights</h2>
              <p>Under Kenya's Data Protection Act 2019, you have the right to access, correct, and delete your personal data. <a href="mailto:support&#64;kenyaadverts.com" className="text-primary hover:underline">Contact our support team</a> to exercise these rights.</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
