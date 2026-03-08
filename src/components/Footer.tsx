import { Facebook, Twitter, Linkedin, Share2, Link as LinkIcon, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Social Share */}
      <div className="border-b border-background/10 py-4">
        <div className="px-4 md:px-8 lg:px-16 xl:px-24 flex items-center justify-center gap-4">
          <span className="text-xs text-background/50">Share KenyaAdvert:</span>
          <div className="flex gap-2">
            {[Facebook, Twitter, Linkedin, Share2, LinkIcon].map((Icon, i) => (
              <button key={i} className="w-7 h-7 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="px-4 md:px-8 lg:px-16 xl:px-24 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-heading font-semibold text-xs mb-4 uppercase tracking-wider text-background/80">KenyaAdvert</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              <li><Link to="/faqs" className="hover:text-background transition-colors">About</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-background transition-colors">Blog</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">FAQs</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Safety Tips</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-xs mb-4 uppercase tracking-wider text-background/80">More</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              <li><Link to="/search" className="hover:text-background transition-colors">Exclusive Shops</Link></li>
              <li><Link to="/search?category=Deals" className="hover:text-background transition-colors">Deals</Link></li>
              <li><Link to="/credits" className="hover:text-background transition-colors">Credit Bundles</Link></li>
              <li><Link to="/search?category=Business+Profiles" className="hover:text-background transition-colors">Business Profiles</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-xs mb-4 uppercase tracking-wider text-background/80">Partner Sites</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              {["BrighterMonday", "BuyRentKenya"].map(item => (
                <li key={item}><a href="#" className="hover:text-background transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-xs mb-4 uppercase tracking-wider text-background/80">International</h4>
            <ul className="space-y-2.5 text-sm text-background/50">
              {["ROAM", "Expat-Dakar"].map(item => (
                <li key={item}><a href="#" className="hover:text-background transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-background/50">Follow us:</span>
            <div className="flex gap-1.5">
              {[
                { icon: Facebook, label: "FB" },
                { icon: Twitter, label: "TW" },
                { icon: Instagram, label: "IG" },
                { icon: Linkedin, label: "LI" },
                { icon: Youtube, label: "YT" },
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="w-7 h-7 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-background/40">© 2025 KenyaAdvert. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
