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

const SITE_URL = "https://www.kenyaadverts.co.ke";

/** Slug-only URL: /ads/lost-dog-golden-retriever-westlands */
export const getAdPath = ({ slug, title }: AdLinkInput) =>
  `/ads/${slug || slugifyAdTitle(title)}`;

export const getAdAbsoluteUrl = (ad: AdLinkInput) =>
  `${SITE_URL}${getAdPath(ad)}`;

/**
 * Share URL — routes through /share/ad/:slug so the og-share
 * edge function serves proper OG meta to WhatsApp/social crawlers.
 * The function then redirects real users to the actual /ads/:slug page.
 */
export const getAdShareUrl = (ad: AdLinkInput) =>
  `${SITE_URL}/share/ad/${encodeURIComponent(ad.slug || slugifyAdTitle(ad.title))}`;

export const getBlogShareUrl = (slug: string) =>
  `${SITE_URL}/share/blog/${encodeURIComponent(slug)}`;

export const getPageShareUrl = (slug: string) =>
  `${SITE_URL}/share/page/${encodeURIComponent(slug)}`;

export const getShareSnippet = (description?: string | null) => {
  if (!description) return "";
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
};
