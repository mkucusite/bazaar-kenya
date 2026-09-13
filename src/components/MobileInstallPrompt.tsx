import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import LogoImage from "@/components/LogoImage";

const DISMISS_KEY = "ka_pwa_install_dismissed_until";

export const MobileInstallPrompt = () => {
  const { ready, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (!until || Date.now() > until) {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 24 * 60 * 60 * 1000));
    } catch {}
    setDismissed(true);
  };

  const handleInstall = async () => {
    await install();
    setDismissed(true);
  };

  if (!ready || dismissed) return null;

  return (
    <div
      role="banner"
      aria-label="Install KenyaAdvert App"
      className="fixed bottom-16 md:bottom-5 left-3 right-3 md:left-auto md:right-5 z-40 md:max-w-sm animate-in slide-in-from-bottom-3 duration-300"
    >
      <div className="relative rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-md p-3.5 shadow-xl">
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3">
          <LogoImage alt="KenyaAdvert" className="w-10 h-10 rounded-xl flex-shrink-0 object-cover border border-border/50" width={40} height={40} />
          <div className="min-w-0 flex-1 pr-4">
            <p className="text-xs font-bold text-foreground leading-tight">
              Install KenyaAdvert App
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Browse faster & save mobile data across all 47 counties.
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1 h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Install App
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 text-xs text-muted-foreground px-2.5"
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MobileInstallPrompt;
