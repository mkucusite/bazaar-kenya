import { Phone, MessageCircle, MessageSquare, MapPin, Calendar } from "lucide-react";
import type { Ad } from "@/data/mockData";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold";
}

const AdCard = ({ ad, variant = "default" }: AdCardProps) => {
  const isGold = variant === "gold" || ad.badge === "gold";

  return (
    <div className={`rounded-xl overflow-hidden transition-shadow hover:shadow-lg ${isGold ? "gold-card" : "bg-card border border-border"}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
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
          <span>{ad.location}, {ad.county}</span>
          <span className="mx-1">•</span>
          <Calendar className="w-3 h-3" />
          <span>{ad.date}</span>
        </div>
        <div className="flex gap-1.5">
          <button className="btn-call flex-1 !py-1.5 !text-xs">
            <Phone className="w-3 h-3" /> Call
          </button>
          <button className="btn-whatsapp flex-1 !py-1.5 !text-xs">
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </button>
          <button className="btn-chat flex-1 !py-1.5 !text-xs">
            <MessageSquare className="w-3 h-3" /> Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdCard;
