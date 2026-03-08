import { Phone, MessageCircle, MapPin, Crown, Award, Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ad } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold" | "silver";
}

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

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

  return (
    <Link to={getAdPath({ id: ad.id, title: ad.title })} className="block group">
      <div className={`rounded-2xl overflow-hidden transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 ${
        isGold 
          ? "bg-gradient-to-b from-amber-50 to-card border-2 border-amber-300/60 shadow-amber-100/50 shadow-md" 
          : isSilver
            ? "bg-card border-2 border-silver/30"
            : "bg-card border border-border/50"
      }`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={ad.image} 
            alt={ad.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            loading="lazy" 
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Price overlay */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-block px-2.5 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-md">
              {ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Free"}
            </span>
          </div>

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isGold && (
              <span className="badge-gold shadow-md">
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
          
          {/* Condition - Top Right */}
          {ad.condition && (
            <span className={`absolute top-2 right-2 ${ad.condition === "New" ? "badge-new" : "badge-used"}`}>
              {ad.condition}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 leading-snug min-h-[2.5rem]">
            {ad.title}
          </h3>
          
          {/* Meta row */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{ad.location}</span>
            </span>
            <span className="flex items-center gap-1 flex-shrink-0 ml-1">
              <Clock className="w-3 h-3" />
              {timeAgo(ad.date)}
            </span>
          </div>

          {/* Views count */}
          {ad.views > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
              <Eye className="w-3 h-3" />
              <span>{ad.views} views</span>
            </div>
          )}

          {/* CTA Buttons - Unique stacked design */}
          <div className="grid grid-cols-2 gap-1.5">
            <button 
              onClick={handleCall} 
              className="h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Phone className="w-3 h-3" />
              Call
            </button>
            <button 
              onClick={handleWhatsApp} 
              className="h-8 rounded-lg text-white flex items-center justify-center gap-1 text-xs font-medium transition-all hover:brightness-110" 
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
