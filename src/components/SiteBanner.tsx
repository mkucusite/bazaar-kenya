import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImageUrl } from "@/lib/image-utils";
import { ExternalLink, Megaphone } from "lucide-react";

type BannerData = {
  id: string;
  banner_image: string;
  target_url: string;
  business_name: string;
};

interface SiteBannerProps {
  position: string;
  className?: string;
}

const SiteBanner = ({ position, className = "" }: SiteBannerProps) => {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const impressionTracked = useRef(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("banner_campaigns" as any)
        .select("id,banner_image,target_url,business_name")
        .eq("position", position)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (data) setBanner(data as any);
    };
    load();
  }, [position]);

  useEffect(() => {
    if (!banner || impressionTracked.current) return;
    impressionTracked.current = true;
    supabase.rpc("increment_banner_impressions", { campaign_id: banner.id } as any);
  }, [banner]);

  if (!banner) return null;

  const handleClick = () => {
    supabase.rpc("increment_banner_clicks", { campaign_id: banner.id } as any);
  };

  const bannerAlt = useMemo(
    () => `${banner.business_name} sponsored advert on KenyaAdvert`,
    [banner.business_name],
  );

  return (
    <div className={`relative ${className}`} aria-label="Sponsored banner advert">
      <a
        href={banner.target_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-background/85 px-3 py-1.5 backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
            <Megaphone className="h-3 w-3 text-primary" /> Sponsored
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-xs font-semibold text-foreground">
            <span className="truncate">{banner.business_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
        <img
          src={optimizeImageUrl(banner.banner_image, 800)}
          alt={bannerAlt}
          className="aspect-[6/1] min-h-20 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          width={800}
          height={120}
          decoding="async"
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default SiteBanner;
