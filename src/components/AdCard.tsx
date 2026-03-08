import { Phone, MessageCircle, MessageSquare, MapPin, Crown, Award } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ad } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold" | "silver";
}

const AdCard = ({ ad, variant = "default" }: AdCardProps) => {
  const isGold = variant === "gold" || ad.badge === "gold";
  const isSilver = variant === "silver" || ad.badge === "silver";

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

  const handleChat = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to chat
  };

  return (
    <Link to={getAdPath({ id: ad.id, title: ad.title })} className="block group">
      <div className={`rounded-xl overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5 ${
        isGold 
          ? "bg-gradient-to-b from-amber-50 to-white border border-amber-200" 
          : "bg-card border border-border/60"
      }`}>
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={ad.image} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            loading="lazy" 
          />
          
          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isGold && (
              <span className="badge-gold">
                <Crown className="w-2.5 h-2.5" />
                GOLD
              </span>
            )}
            {isSilver && !isGold && (
              <span className="badge-silver">
                <Award className="w-2.5 h-2.5" />
                SILVER
              </span>
            )}
          </div>
          
          {/* Condition Badge - Top Right */}
          {ad.condition && (
            <span className={`absolute top-2 right-2 ${ad.condition === "New" ? "badge-new" : "badge-used"}`}>
              {ad.condition}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1.5 leading-snug min-h-[2.5rem]">
            {ad.title}
          </h3>
          
          {/* Price */}
          <p className="text-base md:text-lg font-bold text-primary mb-1.5">
            {ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Contact for Price"}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{ad.location}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <button onClick={handleCall} className="flex-1 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-1 text-xs font-medium">
              <Phone className="w-3 h-3" />
              <span className="hidden sm:inline">Call</span>
            </button>
            <button onClick={handleWhatsApp} className="flex-1 h-8 rounded-lg text-white flex items-center justify-center gap-1 text-xs font-medium transition-colors" style={{ backgroundColor: "#25D366" }}>
              <MessageCircle className="w-3 h-3" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button onClick={handleChat} className="flex-1 h-8 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center justify-center gap-1 text-xs font-medium">
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
