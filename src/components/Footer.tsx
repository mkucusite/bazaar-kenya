import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="container-app py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">KA</span>
              </div>
              <span className="font-heading font-bold text-base">KenyaAdvert</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Buy. Sell. Advertise. Kenya's trusted classifieds platform.
            </p>
            <div className="flex gap-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/faqs" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/post-ad" className="hover:text-white transition-colors">Post an Ad</Link></li>
              <li><Link to="/credits" className="hover:text-white transition-colors">Buy Credits</Link></li>
              <li><Link to="/subscriptions" className="hover:text-white transition-colors">Premium Packages</Link></li>
              <li><Link to="/search?category=Business+Profiles" className="hover:text-white transition-colors">Business Profiles</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/faqs" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">Safety Tips</Link></li>
              <li><Link to="/faqs" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© 2025 KenyaAdvert. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5" />
            <span>support@kenyaadvert.co.ke</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
