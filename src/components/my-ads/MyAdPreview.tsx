import { useEffect, useState } from "react";
import { Eye, Phone, MessageCircle, Share2, ExternalLink, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { badgeStyles, formatAdDate, formatAdPrice, getPrimaryImage, statusStyles, type ManagedAd } from "./types";

interface MyAdPreviewProps {
  ad: ManagedAd;
  onViewLive: (ad: ManagedAd) => void;
  onShareCopy: (ad: ManagedAd) => void;
  onShareWhatsapp: (ad: ManagedAd) => void;
  onShareTwitter: (ad: ManagedAd) => void;
  onBoost: (ad: ManagedAd) => void;
}

const MyAdPreview = ({ ad, onViewLive, onShareCopy, onShareWhatsapp, onShareTwitter, onBoost }: MyAdPreviewProps) => {
  const images = ad.images && ad.images.length > 0 ? ad.images : [getPrimaryImage(ad)];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    setCurrentImage(0);
  }, [ad.id]);

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden xl:sticky xl:top-20">
      <div className="aspect-[16/10] bg-muted relative">
        <img src={images[currentImage]} alt={ad.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={badgeStyles[ad.badge || "standard"] || badgeStyles.standard}>{ad.badge || "standard"}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[ad.status || "active"] || statusStyles.active}`}>
            {ad.status || "active"}
          </span>
        </div>
      </div>

      {images.length > 1 && (
        <div className="px-4 py-3 border-b border-border/60">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {images.map((image, idx) => (
              <button
                key={`${ad.id}-${idx}`}
                onClick={() => setCurrentImage(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                  currentImage === idx ? "border-primary" : "border-border/60"
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">{ad.title}</h2>
        <p className="text-primary text-2xl font-bold mb-2">{formatAdPrice(ad.price)}</p>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
          <span>{ad.town ? `${ad.town}, ${ad.county}` : ad.county}</span>
          <span>{formatAdDate(ad.created_at)}</span>
        </div>

        {ad.description && (
          <div className="mb-5">
            <h3 className="font-semibold text-sm text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-muted/60 rounded-xl p-3 text-center">
            <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{ad.views_count || 0}</p>
            <p className="text-[11px] text-muted-foreground">Views</p>
          </div>
          <div className="bg-muted/60 rounded-xl p-3 text-center">
            <Phone className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{ad.contacts_count || 0}</p>
            <p className="text-[11px] text-muted-foreground">Contacts</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-10" onClick={() => onViewLive(ad)}>
            <ExternalLink className="w-4 h-4 mr-1.5" /> View Live
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => onShareCopy(ad)}>
            <Share2 className="w-4 h-4 mr-1.5" /> Copy Link
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => onShareWhatsapp(ad)}>
            <MessageCircle className="w-4 h-4 mr-1.5" /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" className="h-10" onClick={() => onShareTwitter(ad)}>
            <Share2 className="w-4 h-4 mr-1.5" /> Twitter
          </Button>
        </div>

        {ad.badge === "standard" && (
          <div className="mt-5 p-4 rounded-xl border border-gold/20 bg-gold/10">
            <h4 className="font-heading text-sm font-semibold text-foreground mb-1">Boost this ad</h4>
            <p className="text-xs text-muted-foreground mb-3">Move this ad to the top with Silver or Gold.</p>
            <Button size="sm" className="h-9" onClick={() => onBoost(ad)}>
              <Crown className="w-4 h-4 mr-1.5" /> Choose Boost
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAdPreview;
