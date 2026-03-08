export interface AdLinkInput {
  id: string;
  title?: string | null;
  slug?: string | null;
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

/** Slug-only URL: /ads/lost-dog-golden-retriever-westlands */
export const getAdPath = ({ slug, title }: AdLinkInput) =>
  `/ads/${slug || slugifyAdTitle(title)}`;

export const getAdAbsoluteUrl = (ad: AdLinkInput) => {
  const base = "https://www.kenyaadverts.co.ke";
  return `${base}${getAdPath(ad)}`;
};

/** URL for sharing that serves proper OG tags via edge function, then redirects */
export const getAdShareUrl = (ad: AdLinkInput) => `${OG_SHARE_BASE}/ad/${ad.id}`;

export const getBlogShareUrl = (slug: string) => `${OG_SHARE_BASE}/blog/${encodeURIComponent(slug)}`;

export const getShareSnippet = (description?: string | null) => {
  if (!description) return "";
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
};
