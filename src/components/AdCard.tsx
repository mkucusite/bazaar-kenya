import { Phone, MessageCircle, MessageSquare, MapPin } from "lucide-react";
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
    <Link to={`/ads/${ad.id}`} className="block group">
      <div className={`rounded-xl overflow-hidden transition-all duration-200 group-hover:shadow-md ${isGold ? "gold-card" : "bg-card border border-border/50"}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img src={ad.image} alt={ad.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            {ad.badge === "gold" && <span className="gold-badge">GOLD</span>}
            {ad.badge === "silver" && <span className="silver-badge">SILVER</span>}
          </div>
          {ad.condition && (
            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-foreground/60 text-background text-[9px] font-medium rounded backdrop-blur-sm">
              {ad.condition}
            </span>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="font-medium text-xs md:text-sm text-foreground line-clamp-2 mb-1 leading-snug">{ad.title}</h3>
          <p className="text-sm md:text-base font-bold text-primary mb-1">
            {ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Contact for Price"}
          </p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{ad.location}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={handleCall} className="btn-call flex-1 !py-1 !text-[10px] !px-1.5">
              <Phone className="w-2.5 h-2.5" /> Call
            </button>
            <button onClick={handleWhatsApp} className="btn-whatsapp flex-1 !py-1 !text-[10px] !px-1.5">
              <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
            </button>
            <button className="btn-chat flex-1 !py-1 !text-[10px] !px-1.5">
              <MessageSquare className="w-2.5 h-2.5" /> Chat
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
