import { Phone, MessageCircle, MessageSquare, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ad } from "@/data/mockData";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold";
}

const AdCard = ({ ad, variant = "default" }: AdCardProps) => {
  const isGold = variant === "gold" || ad.badge === "gold";

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`tel:${ad.phone}`);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phone = (ad.whatsapp || ad.phone).replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi, I'm interested in "${ad.title}" on KenyaAdvert`)}`);
  };

  return (
    <Link to={`/ads/${ad.id}`} className="block">
      <div className={`rounded-xl overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${isGold ? "gold-card" : "bg-card border border-border"}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img src={ad.image} alt={ad.title} className="w-full h-full object-cover transition-transform hover:scale-105" loading="lazy" />
          {ad.badge === "gold" && <span className="absolute top-2 left-2 gold-badge">GOLD</span>}
          {ad.badge === "silver" && <span className="absolute top-2 left-2 silver-badge">SILVER</span>}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{ad.title}</h3>
          <p className="text-lg font-bold text-primary mb-1">
            {ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Contact for Price"}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{ad.location}, {ad.county}</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={handleCall} className="btn-call flex-1 !py-1.5 !text-xs">
              <Phone className="w-3 h-3" /> Call
            </button>
            <button onClick={handleWhatsApp} className="btn-whatsapp flex-1 !py-1.5 !text-xs">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </button>
            <button className="btn-chat flex-1 !py-1.5 !text-xs">
              <MessageSquare className="w-3 h-3" /> Chat
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
