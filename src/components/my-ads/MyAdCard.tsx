import { Eye, Pencil, Trash2, ExternalLink, Crown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { badgeStyles, formatAdDate, formatAdPrice, getPrimaryImage, statusStyles, type ManagedAd } from "./types";

interface MyAdCardProps {
  ad: ManagedAd;
  selected: boolean;
  onSelect: (ad: ManagedAd) => void;
  onViewLive: (ad: ManagedAd) => void;
  onShare: (ad: ManagedAd) => void;
  onEdit: (ad: ManagedAd) => void;
  onDelete: (ad: ManagedAd) => void;
  onBoost: (ad: ManagedAd, tier: "silver" | "gold") => void;
}

const MyAdCard = ({ ad, selected, onSelect, onViewLive, onShare, onEdit, onDelete, onBoost }: MyAdCardProps) => {
  const images = ad.images || [];

  return (
    <article
      className={`rounded-2xl border bg-card p-3 transition-all ${
        selected ? "border-primary shadow-md" : "border-border/60 hover:border-border"
      }`}
    >
      <button onClick={() => onSelect(ad)} className="w-full text-left">
        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted mb-3">
          <img src={getPrimaryImage(ad)} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-3">
            {images.slice(0, 8).map((image, idx) => (
              <img
                key={`${ad.id}-${idx}`}
                src={image}
                alt=""
                className="w-14 h-11 rounded-lg object-cover border border-border/60 flex-shrink-0"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2">{ad.title}</h3>
          <span className={badgeStyles[ad.badge || "standard"] || badgeStyles.standard}>{ad.badge || "standard"}</span>
        </div>

        <p className="text-primary font-bold text-base">{formatAdPrice(ad.price)}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatAdDate(ad.created_at)}</span>
          <span className={`px-2 py-0.5 rounded font-medium ${statusStyles[ad.status || "active"] || statusStyles.active}`}>
            {ad.status || "active"}
          </span>
          <span className="font-mono px-2 py-0.5 rounded bg-muted text-foreground/70">
            ID: {(ad as any).ad_code || ad.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button variant="outline" size="sm" className="h-9" onClick={() => onSelect(ad)}>
          <Eye className="w-4 h-4 mr-1" /> Preview
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => onViewLive(ad)}>
          <ExternalLink className="w-4 h-4 mr-1" /> Live
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => onShare(ad)}>
          <Share2 className="w-4 h-4 mr-1" /> Share
        </Button>
        <Button variant="outline" size="sm" className="h-9" onClick={() => onEdit(ad)}>
          <Pencil className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button variant="outline" size="sm" className="h-9 text-destructive col-span-2" onClick={() => onDelete(ad)}>
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>

      {ad.badge === "standard" && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button variant="secondary" size="sm" className="h-9" onClick={() => onBoost(ad, "silver")}>
            <Crown className="w-4 h-4 mr-1" /> Silver
          </Button>
          <Button size="sm" className="h-9" onClick={() => onBoost(ad, "gold")}>
            <Crown className="w-4 h-4 mr-1" /> Gold
          </Button>
        </div>
      )}

      {ad.badge === "silver" && (
        <Button size="sm" className="h-9 w-full mt-2" onClick={() => onBoost(ad, "gold")}>
          <Crown className="w-4 h-4 mr-1" /> Upgrade to Gold
        </Button>
      )}
    </article>
  );
};

export default MyAdCard;
