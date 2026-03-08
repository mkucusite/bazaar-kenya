import { Download } from "lucide-react";
import logo from "@/assets/kenyaadvert-logo.png";
import { Link } from "react-router-dom";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const BrandBadge = () => {
  const { ready, install } = usePwaInstall();

  if (ready) {
    return (
      <button
        onClick={install}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-1.5 hover:shadow-xl transition-all hover:scale-105 text-xs font-semibold"
        aria-label="Download App"
      >
        <img src={logo} alt="" className="h-5 w-5 rounded-full object-contain" />
        <Download className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <Link
      to="/"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 shadow-lg p-1.5 hover:shadow-xl transition-all hover:scale-105"
      aria-label="KenyaAdvert"
    >
      <img src={logo} alt="KenyaAdvert" className="h-6 w-6 rounded-full object-contain" />
    </Link>
  );
};

export default BrandBadge;
