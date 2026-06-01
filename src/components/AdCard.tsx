import { Phone, MessageCircle, MapPin, Crown, Award, Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ad } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";
import OptimizedImage from "@/components/OptimizedImage";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold" | "silver";
  uniform?: boolean;
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

const AdCard = ({ ad, variant = "default", uniform = false }: AdCardProps) => {
  const isGold = variant === "gold" || ad.badge === "gold";
  const isSilver = variant === "silver" || ad.badge === "silver";
  const imageShape = (() => {
    if (uniform) return "aspect-[4/3]";
    const seed = `${ad.id}${ad.title}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return ["aspect-[4/3]", "aspect-[3/4]", "aspect-square", "aspect-[5/4]"][seed % 4];
  })();

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`tel:${ad.phone}`);
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = (ad.whatsapp || ad.phone).replace(/[^0-9]/g, "");
    const phone = raw.startsWith("0") ? "254" + raw.slice(1) : raw.startsWith("254") ? raw : "254" + raw;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hi, I'm interested in "${ad.title}" on KenyaAdvert`)}`);
  };

  return (
    <Link to={getAdPath({ id: ad.id, title: ad.title, slug: ad.slug })} className={`mb-3 block break-inside-avoid group ${uniform ? "h-full" : ""}`}>
      <div className={`flex flex-col overflow-hidden rounded-xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg ${uniform ? "h-full" : ""} ${
        isGold 
          ? "bg-gradient-to-b from-amber-50 to-card border-2 border-amber-300/60 shadow-amber-100/50 shadow-md" 
          : isSilver
            ? "bg-card border-2 border-silver/30"
            : "bg-card border border-border/50"
      }`}>
        {/* Image */}
        <div className={`relative ${imageShape} overflow-hidden bg-muted`}>
          <OptimizedImage
            src={ad.image}
            alt={ad.title}
            width={400}
            height={300}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
        <div className={`p-2.5 md:p-3 ${uniform ? "flex flex-1 flex-col" : ""}`}>
          <h3 className="mb-2 font-medium text-[13px] md:text-sm text-foreground line-clamp-2 leading-snug">
            {ad.title}
          </h3>
          
          {/* Meta row */}
          <div className="mb-2 flex items-center justify-between text-[11px] md:text-xs text-muted-foreground">
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
            <div className="mb-2 md:mb-3 flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{ad.views} views</span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className={`grid grid-cols-2 gap-1.5 ${uniform ? "mt-auto" : ""}`}>
            <button
              onClick={handleCall}
              aria-label={`Call about ${ad.title}`}
              className="flex h-8 items-center justify-center gap-1 overflow-hidden rounded-lg bg-primary px-1.5 text-[11px] md:text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">Call</span>
            </button>
            <button
              onClick={handleWhatsApp}
              aria-label={`WhatsApp about ${ad.title}`}
              className="flex h-8 items-center justify-center gap-1 overflow-hidden rounded-lg bg-whatsapp px-1.5 text-[11px] md:text-xs font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              <svg viewBox="0 0 32 32" className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 fill-current" aria-hidden="true">
                <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.302.244-.66.244-.99 0-.155-.043-.302-.13-.43-.215-.36-1.79-1.07-2.22-1.27z"/>
                <path d="M16.207 0C7.435 0 .331 7.104.331 15.875c0 2.992.83 5.79 2.273 8.179L0 32l8.176-2.607a15.85 15.85 0 0 0 8.031 2.182C24.978 31.575 32 24.526 32 15.875 32 7.104 24.978 0 16.207 0zm0 28.85c-2.62 0-5.07-.802-7.103-2.175l-4.954 1.578 1.6-4.78A12.93 12.93 0 0 1 3.28 15.875c0-7.13 5.804-12.93 12.927-12.93 7.124 0 12.928 5.8 12.928 12.93s-5.804 12.974-12.928 12.974z"/>
              </svg>
              <span className="truncate">WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AdCard;
