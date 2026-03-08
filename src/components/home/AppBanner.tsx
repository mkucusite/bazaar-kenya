import { Smartphone, Mail } from "lucide-react";
import { useState, useEffect } from "react";

const AppBanner = () => {
  const [email, setEmail] = useState("");
  const [pwaSupported, setPwaSupported] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPwaSupported(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  };

  return (
    <section className="section-padding overflow-hidden">
      <div className="container-app">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <h3 className="font-heading font-bold text-sm text-foreground mb-1">
                  Add to Home Screen
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Browse, buy and sell on the go.
                </p>
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" /> Install App
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
