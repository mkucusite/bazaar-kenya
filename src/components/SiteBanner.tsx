import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  if (!banner) return null;

  const handleClick = async () => {
    // Track click
    await supabase
      .from("banner_campaigns" as any)
      .update({ clicks: (banner as any).clicks + 1 } as any)
      .eq("id", banner.id);
  };

  const handleImpression = () => {
    // Track impression on mount
    supabase
      .from("banner_campaigns" as any)
      .update({} as any)
      .eq("id", banner.id)
      .then(() => {
        // Use RPC or increment — simplified here
      });
  };

  useEffect(() => {
    if (banner) handleImpression();
  }, [banner]);

  return (
    <div className={`relative ${className}`}>
      <a
        href={banner.target_url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow"
      >
        <img
          src={banner.banner_image}
          alt={`${banner.business_name} - Sponsored`}
          className="w-full object-cover"
          style={{ maxHeight: "120px" }}
          loading="lazy"
        />
      </a>
      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[9px] font-medium text-muted-foreground">
        Sponsored
      </span>
    </div>
  );
};

export default SiteBanner;
