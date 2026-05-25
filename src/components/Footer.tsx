import { Facebook, Twitter, Instagram, Youtube, Mail, Shield, FileText, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
const Footer = () => {
  const [spotlights, setSpotlights] = useState<Array<{ id: string; business_name: string }>>([]);

  useEffect(() => {
    // Cache rotation per UTC day so it changes once daily but stays stable for the user
    const cacheKey = "footer-spotlight-v1";
    const today = new Date().toISOString().slice(0, 10);
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached?.date === today && Array.isArray(cached.items)) {
        setSpotlights(cached.items);
        return;
      }
    } catch {}
    (async () => {
      const { data } = await supabase
        .from("business_profiles" as any)
        .select("id,business_name,is_verified")
        .order("is_verified", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40);
      const rows = (data as any[]) || [];
      if (rows.length === 0) return;
      // Deterministic daily shuffle
      const seed = today.split("-").join("");
      const seedNum = Number(seed) || Date.now();
      const picked = rows
        .map((r, i) => ({ r, k: (seedNum * (i + 17)) % 9973 }))
        .sort((a, b) => a.k - b.k)
        .slice(0, 3)
        .map(({ r }) => ({ id: r.id, business_name: r.business_name }));
      setSpotlights(picked);
      try { localStorage.setItem(cacheKey, JSON.stringify({ date: today, items: picked })); } catch {}
    })();
  }, []);


  return (
    <footer className="bg-foreground text-background">
      <div className="container-app py-10 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <a href="https://www.kenyaadverts.com/" aria-label="KenyaAdvert homepage">
                <img alt="KenyaAdvert" className="h-14 md:h-16 w-auto object-contain" loading="lazy" width={56} height={56} src="/lovable-uploads/40eec99c-4ea8-4916-8773-85237ab37dfe.webp" />
              </a>
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
              <li><a href="mailto:support&#64;kenyaadverts.com" className="hover:text-background transition-colors">Contact</a></li>
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
              {spotlights.length > 0 && (
                <li className="pt-2 mt-2 border-t border-background/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-background/40 mb-1.5">Spotlight today</p>
                  <ul className="space-y-1">
                    {spotlights.map((s) => (
                      <li key={s.id}>
                        <Link to={`/business-profile?id=${s.id}`} className="hover:text-background transition-colors line-clamp-1">{s.business_name}</Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
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

        {/* Crawler-discoverable links to active listings and events */}
        <div className="pt-4 border-t border-background/10 mb-6">
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-background/40">
            <span className="text-background/60 font-semibold">Featured:</span>
            <a href="https://www.kenyaadverts.com/ads/last-jazz-night-painting" className="hover:text-background/80">Last Jazz Night Painting</a>
            <a href="https://www.kenyaadverts.com/ads/typical-walkingfoot-sewing-machine" className="hover:text-background/80">Walkingfoot Sewing Machine</a>
            <a href="https://www.kenyaadverts.com/ads/vital-2-ton-chainblock" className="hover:text-background/80">Vital 2 Ton Chainblock</a>
            <a href="https://www.kenyaadverts.com/events/hypertension-the-silent-killer" className="hover:text-background/80">Hypertension Event</a>
            <a href="https://www.kenyaadverts.com/events/mkumsa-fun-day" className="hover:text-background/80">MKUMSA Fun Day</a>
          </div>
        </div>

        <div className="pt-4 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-background/60">&copy; {new Date().getFullYear()} KenyaAdvert. All rights reserved.</p>
          <a href="mailto:support&#64;kenyaadverts.com" className="flex items-center gap-2 text-xs text-background/60 hover:text-background/80 transition-colors">
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </footer>);

};

export default Footer;