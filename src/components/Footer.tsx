import { Facebook, Twitter, Instagram, Youtube, Mail, Shield, FileText, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/kenyaadvert-logo.webp";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container-app py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img alt="KenyaAdvert" className="h-14 md:h-16 w-auto object-contain brightness-0 invert" loading="lazy" width={56} height={56} src={logo} />
            </div>
            <p className="text-sm text-background/60 mb-4">Buy. Sell. Advertise. Kenya's trusted classifieds platform.</p>
            <div className="flex gap-2">
              {[
              { Icon: Facebook, href: "https://www.facebook.com/kenyaadvert", label: "Facebook" },
              { Icon: Twitter, href: "https://x.com/kenyaadvert", label: "X (Twitter)" },
              { Icon: Instagram, href: "https://www.instagram.com/kenyaadvert", label: "Instagram" },
              { Icon: Youtube, href: "https://www.youtube.com/@kenyaadvert", label: "YouTube" }].
              map(({ Icon, href, label }) =>
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-8 h-8 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link to="/about" className="hover:text-background transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-background transition-colors">Blog</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">FAQs</Link></li>
              <li><a href="mailto:support&#64;kenyaadverts.co.ke" className="hover:text-background transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link to="/post-ad" className="hover:text-background transition-colors">Post an Ad</Link></li>
              <li><Link to="/credits" className="hover:text-background transition-colors">Buy Credits</Link></li>
              <li><Link to="/subscriptions" className="hover:text-background transition-colors">Premium Packages</Link></li>
              <li><Link to="/business-profile" className="hover:text-background transition-colors">Business Profiles</Link></li>
              <li><Link to="/advertise" className="hover:text-background transition-colors">Advertise With Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Legal & Safety</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><Link to="/privacy" className="hover:text-background transition-colors flex items-center gap-1.5"><Lock className="w-3 h-3" /> Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-background transition-colors flex items-center gap-1.5"><FileText className="w-3 h-3" /> Terms of Service</Link></li>
              <li><Link to="/safety-tips" className="hover:text-background transition-colors flex items-center gap-1.5"><Shield className="w-3 h-3" /> Safety Tips</Link></li>
            </ul>
          </div>
        </div>

        {/* Security & Payment badges */}
        <div className="pt-6 border-t border-background/10 mb-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 text-xs text-background/50">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-background/50">
              <Lock className="w-4 h-4 text-primary" />
              <span>M-Pesa Secure Payments</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-background/50">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Data Protected</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-background/50">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/60">&copy; {new Date().getFullYear()} KenyaAdvert. All rights reserved.</p>
          <a href="mailto:support&#64;kenyaadverts.co.ke" className="flex items-center gap-2 text-xs text-background/60 hover:text-background/80 transition-colors">
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </footer>);

};

export default Footer;