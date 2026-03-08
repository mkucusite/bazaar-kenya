import type { Ad } from "@/data/mockData";
import type { Tables } from "@/integrations/supabase/types";
import { optimizeImageUrl } from "@/lib/image-utils";

export type DbAd = Tables<"ads">;

export const mapDbAdToCard = (ad: DbAd): Ad => ({
  id: ad.id,
  title: ad.title,
  price: Number(ad.price || 0),
  location: ad.town ? `${ad.town}, ${ad.county}` : ad.county,
  county: ad.county,
  image: optimizeImageUrl(ad.images?.[0], 400, 300),
  category: "Listings",
  date: ad.created_at || new Date().toISOString(),
  badge: (ad.badge as "gold" | "silver" | undefined) || undefined,
  condition: (ad.condition as "New" | "Used" | "Refurbished" | undefined) || undefined,
  phone: ad.phone,
  whatsapp: ad.whatsapp || undefined,
  views: ad.views_count || 0,
  slug: (ad as any).slug || undefined,
});

export const matchesCategoryFallback = (ad: DbAd, category: string) => {
  if (!category) return true;
  const term = category.toLowerCase();
  const title = ad.title?.toLowerCase() || "";
  const description = ad.description?.toLowerCase() || "";
  return title.includes(term) || description.includes(term);
};
