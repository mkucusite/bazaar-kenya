import { Facebook, Twitter, Linkedin, Share2, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Social Share */}
      <div className="border-b border-muted-foreground/20 py-4">
        <div className="section-padding flex items-center justify-center gap-4">
          <span className="text-sm text-muted-foreground">Share KenyaAdvert:</span>
          <div className="flex gap-3">
            {[Facebook, Twitter, Linkedin, Share2, LinkIcon].map((Icon, i) => (
              <button key={i} className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-primary transition-colors">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="section-padding py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider">KenyaAdvert</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faqs" className="hover:text-background transition-colors">About</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-background transition-colors">Blog</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">FAQs</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-background transition-colors">Safety Tips</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider">More</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-background transition-colors">Exclusive Shops</Link></li>
              <li><Link to="/search?category=Deals" className="hover:text-background transition-colors">Deals</Link></li>
              <li><Link to="/credits" className="hover:text-background transition-colors">Credit Bundles</Link></li>
              <li><Link to="/search?category=Business+Profiles" className="hover:text-background transition-colors">Business Profiles</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider">Partner Sites</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["BrighterMonday", "BuyRentKenya"].map(item => (
                <li key={item}><a href="#" className="hover:text-background transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider">International</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["ROAM", "Expat-Dakar"].map(item => (
                <li key={item}><a href="#" className="hover:text-background transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-muted-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Follow KenyaAdvert:</span>
            <div className="flex gap-2">
              {["FB", "TW", "IG", "LI", "PI", "YT"].map(s => (
                <span key={s} className="w-7 h-7 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[10px] font-bold hover:bg-primary transition-colors cursor-pointer">{s}</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 KenyaAdvert. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
