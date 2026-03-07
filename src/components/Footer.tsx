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
              {["About", "Contact", "Blog", "FAQs", "Privacy Policy", "Safety Tips"].map(item => (
                <li key={item}><Link to="/" className="hover:text-background transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm mb-4 uppercase tracking-wider">More</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {["Exclusive Shops", "Deals", "Credit Bundles", "Business Profiles"].map(item => (
                <li key={item}><Link to="/" className="hover:text-background transition-colors">{item}</Link></li>
              ))}
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
