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

const FALLBACK_SITE_URL = "https://www.kenyaadverts.com";

const getBaseUrl = () => FALLBACK_SITE_URL;

/** Slug-only URL: /ads/lost-dog-golden-retriever-westlands */
export const getAdPath = ({ slug, title }: AdLinkInput) =>
  `/ads/${slug || slugifyAdTitle(title)}`;

export const getAdAbsoluteUrl = (ad: AdLinkInput) =>
  `${getBaseUrl()}${getAdPath(ad)}`;

/**
 * Share URLs must use /share/* so crawlers (WhatsApp, X, Facebook, etc.)
 * receive server-rendered OG tags before redirecting to the live page.
 */
export const getAdShareUrl = (ad: AdLinkInput) =>
  `${getBaseUrl()}/share/ad/${encodeURIComponent(ad.slug || slugifyAdTitle(ad.title))}`;

export const getBlogShareUrl = (slug: string) =>
  `${getBaseUrl()}/share/blog/${encodeURIComponent(slug)}`;

export const getPageShareUrl = (slug: string) =>
  `${getBaseUrl()}/share/page/${encodeURIComponent(slug)}`;

export const getEventShareUrl = (slug: string) =>
  `${getBaseUrl()}/share/event/${encodeURIComponent(slug)}`;

export const getBannerShareUrl = (slugOrId: string) =>
  `${getBaseUrl()}/share/banner/${encodeURIComponent(slugOrId)}`;

export const getShareSnippet = (description?: string | null) => {
  if (!description) return "";
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
};
