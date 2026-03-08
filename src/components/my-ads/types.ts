import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type ManagedAd = Tables<"ads">;
export type ManagedAdUpdate = TablesUpdate<"ads">;

export const getBadgePriority = (badge?: string | null) => {
  if (badge === "gold") return 0;
  if (badge === "silver") return 1;
  return 2;
};

export const sortAdsByPriority = (ads: ManagedAd[]) => {
  return [...ads].sort((a, b) => {
    const badgeDiff = getBadgePriority(a.badge) - getBadgePriority(b.badge);
    if (badgeDiff !== 0) return badgeDiff;

    const dateA = new Date(a.created_at ?? 0).getTime();
    const dateB = new Date(b.created_at ?? 0).getTime();
    return dateB - dateA;
  });
};

export const formatAdPrice = (price?: number | null) => {
  const normalized = Number(price ?? 0);
  return normalized > 0 ? `KSh ${normalized.toLocaleString()}` : "Contact for price";
};

export const formatAdDate = (date?: string | null) => {
  if (!date) return "Recently";
  return new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const getPrimaryImage = (ad: ManagedAd) => ad.images?.[0] || "/placeholder.svg";

export const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  expired: "bg-muted text-muted-foreground",
  pending: "bg-accent/20 text-accent-foreground",
};

export const badgeStyles: Record<string, string> = {
  gold: "badge-gold",
  silver: "badge-silver",
  standard: "bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
};
