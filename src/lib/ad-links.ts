export interface AdLinkInput {
  id: string;
  title?: string | null;
}

export const slugifyAdTitle = (title?: string | null) => {
  if (!title) return "listing";

  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "listing";
};

const OG_SHARE_BASE = `${import.meta.env.VITE_SUPABASE_URL || "https://tpthlopfhyuuspgooblk.supabase.co"}/functions/v1/og-share`;

export const getAdPath = ({ id, title }: AdLinkInput) => `/ads/${id}/${slugifyAdTitle(title)}`;

export const getAdAbsoluteUrl = (ad: AdLinkInput) => {
  if (typeof window === "undefined") return `https://www.kenyaadverts.co.ke${getAdPath(ad)}`;
  return `${window.location.origin}${getAdPath(ad)}`;
};

/** URL for sharing that serves proper OG tags via edge function, then redirects */
export const getAdShareUrl = (ad: AdLinkInput) => {
  const token = toBase36Uuid(ad.id);
  return `${OG_SHARE_BASE}/ad/${token}`;
};

export const getBlogShareUrl = (slug: string) => `${OG_SHARE_BASE}/blog/${encodeURIComponent(slug)}`;

export const getShareSnippet = (description?: string | null) => {
  if (!description) return "";
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
};
