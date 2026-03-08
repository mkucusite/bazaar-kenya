import logo from "@/assets/kenyaadvert-logo.png";
import { Link } from "react-router-dom";

const BrandBadge = () => (
  <Link
    to="/"
    className="fixed bottom-4 right-4 z-50 rounded-full bg-card/90 backdrop-blur-sm border border-border/60 shadow-lg p-1.5 hover:shadow-xl transition-all hover:scale-105"
    aria-label="KenyaAdvert"
  >
    <img src={logo} alt="KenyaAdvert" className="h-6 w-6 rounded-full object-contain" />
  </Link>
);

export default BrandBadge;
