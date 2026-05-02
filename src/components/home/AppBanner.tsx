import { Smartphone, Mail, Download } from "lucide-react";
import { useState } from "react";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const AppBanner = () => {
  const [email, setEmail] = useState("");
  const { ready, install } = usePwaInstall();

  return (
    <section className="section-padding overflow-hidden">
      <div className="container-app max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-heading font-bold text-sm text-foreground mb-1">
                  Download App
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Install KenyaAdvert for a fast, native experience — no app store needed.
                </p>
                <button
                  onClick={install}
                  disabled={!ready}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {ready ? "Download App" : "Open in browser to install"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-heading font-bold text-sm text-foreground mb-1">
                  Stay in the Loop
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get the hottest deals delivered weekly.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button className="px-4 h-9 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex-shrink-0 whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppBanner;
