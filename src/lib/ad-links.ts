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

export const getAdPath = ({ id, title }: AdLinkInput) => `/ads/${id}/${slugifyAdTitle(title)}`;

export const getAdAbsoluteUrl = (ad: AdLinkInput) => {
  if (typeof window === "undefined") return getAdPath(ad);
  return `${window.location.origin}${getAdPath(ad)}`;
};

export const getShareSnippet = (description?: string | null) => {
  if (!description) return "";
  const clean = description.replace(/\s+/g, " ").trim();
  return clean.length > 120 ? `${clean.slice(0, 117)}...` : clean;
};
