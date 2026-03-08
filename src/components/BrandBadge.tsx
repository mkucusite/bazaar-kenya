import logo from "@/assets/kenyaadvert-logo.png";
import { Link } from "react-router-dom";

const BrandBadge = () => (
  <Link
    to="/"
    className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 shadow-lg px-3 py-1.5 hover:shadow-xl transition-all hover:scale-105"
    aria-label="KenyaAdvert"
  >
    <img src={logo} alt="KenyaAdvert" className="h-5 w-auto" />
    <span className="text-[10px] font-semibold text-foreground hidden sm:inline">KenyaAdvert</span>
  </Link>
);

export default BrandBadge;
