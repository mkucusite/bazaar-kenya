import { Phone, MessageCircle, MapPin, Crown, Award, Clock, Eye, Heart, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ad } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";
import OptimizedImage from "@/components/OptimizedImage";

interface AdCardProps {
  ad: Ad;
  variant?: "default" | "gold" | "silver";
  uniform?: boolean;
  layout?: "grid" | "list";
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

const AdCard = ({ ad, variant = "default", uniform = false, layout = "grid" }: AdCardProps) => {
  const isGold = variant === "gold" || ad.badge === "gold";
  const isSilver = variant === "silver" || ad.badge === "silver";
  const shouldContainImage = /\b(car|vehicle|toyota|premio|vitz|axio|nissan|mazda|subaru|honda|mercedes|bmw|isuzu|truck|pickup|motorcycle|bike)\b/i.test(`${ad.title} ${ad.category}`);

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

  const priceLabel = ad.price > 0 ? `KSh ${ad.price.toLocaleString()}` : "Free";

  // -------- LIST LAYOUT (horizontal) --------
  if (layout === "list") {
    return (
      <Link
        to={getAdPath({ id: ad.id, title: ad.title, slug: ad.slug })}
        className="group block"
      >
        <div className={`relative flex gap-3 overflow-hidden rounded-xl border bg-card p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:gap-4 sm:p-3 ${
          isGold ? "border-amber-300/70 bg-gradient-to-br from-amber-50/70 to-card dark:from-amber-950/30 dark:to-card"
            : isSilver ? "border-slate-300/70" : "border-border/60"
        }`}>
          {isGold && (
            <span aria-hidden className="ribbon-gold">PREMIUM</span>
          )}
          <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-40">
            <OptimizedImage
              src={ad.image}
              alt={ad.title}
              width={320}
              height={240}
              className={`h-full w-full ${shouldContainImage ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-105`}
            />
            {ad.condition && (
              <span className={`absolute top-1.5 left-1.5 ${ad.condition === "New" ? "badge-new" : "badge-used"}`}>
                {ad.condition}
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-semibold text-sm text-foreground sm:text-base">
                {ad.title}
              </h3>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                aria-label="Save"
                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-1.5 text-base font-bold text-primary sm:text-lg">{priceLabel}</p>
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0" /> {ad.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {timeAgo(ad.date)}
              </span>
              {ad.views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {ad.views}
                </span>
              )}
              {(isGold || isSilver) && (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
            <div className="mt-auto flex items-center gap-1.5">
              <button onClick={handleCall} aria-label={`Call about ${ad.title}`}
                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90">
                <Phone className="h-3.5 w-3.5" /> <span>Call</span>
              </button>
              <button onClick={handleWhatsApp} aria-label={`WhatsApp about ${ad.title}`}
                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-whatsapp px-2 text-xs font-medium text-primary-foreground transition-all hover:brightness-110">
                <MessageCircle className="h-3.5 w-3.5" /> <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // -------- GRID LAYOUT (default) --------
  const imageShape = (() => {
    if (uniform) return "aspect-[4/3]";
    const seed = `${ad.id}${ad.title}`.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const mobileShape = ["aspect-[4/3]", "aspect-[3/4]", "aspect-square", "aspect-[5/4]"][seed % 4];
    return `${mobileShape} md:aspect-[4/3]`;
  })();

  return (
    <Link to={getAdPath({ id: ad.id, title: ad.title, slug: ad.slug })} className={`mb-3 block break-inside-avoid group md:h-full ${uniform ? "h-full" : ""}`}>
      <div className={`relative flex flex-col overflow-hidden rounded-xl transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl md:h-full ${uniform ? "h-full" : ""} ${
        isGold
          ? "border-2 border-amber-300/70 bg-gradient-to-b from-amber-50/80 to-card shadow-md shadow-amber-100/40 dark:from-amber-950/30 dark:to-card"
          : isSilver
            ? "border-2 border-slate-300/60 bg-card"
            : "border border-border/60 bg-card"
      }`}>
        {isGold && <span aria-hidden className="ribbon-gold">PREMIUM</span>}
        {/* Image */}
        <div className={`relative ${imageShape} overflow-hidden bg-muted`}>
          <OptimizedImage
            src={ad.image}
            alt={ad.title}
            width={400}
            height={300}
            className={`w-full h-full ${shouldContainImage ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-110`}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />

          {/* Price overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
            <span className="inline-block rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-md">
              {priceLabel}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              aria-label="Save"
              className="rounded-full bg-white/90 p-1.5 text-foreground/70 backdrop-blur transition hover:text-destructive dark:bg-card/80"
            >
              <Heart className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Badges - Top Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isGold && (
              <span className="badge-gold shadow-md">
                <Crown className="w-2.5 h-2.5" /> GOLD
              </span>
            )}
            {isSilver && !isGold && (
              <span className="badge-silver"><Award className="w-2.5 h-2.5" /> SILVER</span>
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
        <div className={`p-2.5 md:p-3 flex md:flex-1 flex-col ${uniform ? "flex-1" : ""}`}>
          <h3 className="mb-2 font-medium text-[13px] md:text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {ad.title}
          </h3>

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

          {(ad.views > 0 || isGold || isSilver) && (
            <div className="mb-2 md:mb-3 flex items-center justify-between gap-2 text-[11px] md:text-xs text-muted-foreground">
              {ad.views > 0 ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {ad.views} views
                </span>
              ) : <span />}
              {(isGold || isSilver) && (
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          )}

          {/* CTA Buttons */}
          <div className={`grid grid-cols-2 gap-1.5 md:mt-auto ${uniform ? "mt-auto" : ""}`}>
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
