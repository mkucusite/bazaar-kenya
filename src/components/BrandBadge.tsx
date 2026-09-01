import { Download } from "lucide-react";
import LogoImage from "@/components/LogoImage";
import { Link } from "react-router-dom";
import { usePwaInstall } from "@/hooks/use-pwa-install";

const BrandBadge = () => {
  const { ready, install } = usePwaInstall();

  if (ready) {
    return (
      <button
        onClick={install}
        className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-1.5 rounded-full bg-primary text-primary-foreground shadow-lg px-3 py-1.5 hover:shadow-xl transition-all hover:scale-105 text-xs font-semibold"
        aria-label="Download App"
      >
        <LogoImage alt="KenyaAdvert Logo" className="h-5 w-5 rounded-full object-contain" />
        <Download className="w-3.5 h-3.5" />
      </button>
    );
  }

  return null;
};

export default BrandBadge;
