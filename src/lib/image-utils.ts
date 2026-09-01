/**
 * Image URL helpers.
 * - Pass-through for Supabase storage URLs (CDN is not a 1:1 mirror).
 * - Optimize cdn.kenyaadverts.co.ke / R2 / Unsplash URLs only.
 */

const R2_PUBLIC = "https://pub-ee53d01640a84ec3b4f7931c3ae152c3.r2.dev";
const CDN = "https://cdn.kenyaadverts.co.ke";

const normalizeHost = (url: string): string => {
  return url
    .replace("https://cdn.kenyaadverts.com", CDN)
    .replace(R2_PUBLIC, CDN);
};

export const optimizeImageUrl = (
  url: string | undefined | null,
  width: number = 320,
  height?: number,
): string => {
  if (!url) return "/placeholder.svg";
  const normalizedUrl = normalizeHost(url);

  if (/\.svg(?:\?|$)/i.test(normalizedUrl)) return normalizedUrl;

  if (normalizedUrl.includes("unsplash.com")) {
    const u = new URL(normalizedUrl);
    u.searchParams.set("auto", "format,compress");
    u.searchParams.set("q", "55");
    u.searchParams.set("w", String(width));
    if (height) u.searchParams.set("h", String(height));
    u.searchParams.set("fit", "crop");
    return u.toString();
  }

  // Supabase storage: use the render/image transformation endpoint (preserves bucket path).
  if (normalizedUrl.includes("/storage/v1/object/public/")) {
    const transformedUrl = normalizedUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(transformedUrl);
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", "65");
    u.searchParams.set("resize", "cover");
    if (height) u.searchParams.set("height", String(height));
    return u.toString();
  }

  if (normalizedUrl.includes("cdn.kenyaadverts.co.ke")) {
    const params = new URLSearchParams();
    params.set("w", String(width));
    params.set("q", "70");
    if (height) params.set("h", String(height));
    return `${normalizedUrl}?${params.toString()}`;
  }

  return normalizedUrl;
};

export const getPlaceholderUrl = (url: string | undefined | null, size = 24): string => {
  if (!url) return "/placeholder.svg";
  const normalizedUrl = normalizeHost(url);

  if (/\.svg(?:\?|$)/i.test(normalizedUrl)) return normalizedUrl;

  if (normalizedUrl.includes("unsplash.com")) {
    const u = new URL(normalizedUrl);
    u.searchParams.set("w", String(size));
    u.searchParams.set("q", "10");
    u.searchParams.set("blur", "20");
    u.searchParams.set("auto", "format");
    return u.toString();
  }

  if (normalizedUrl.includes("/storage/v1/object/public/")) {
    const transformedUrl = normalizedUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(transformedUrl);
    u.searchParams.set("width", String(size));
    u.searchParams.set("quality", "20");
    return u.toString();
  }

  if (normalizedUrl.includes("cdn.kenyaadverts.co.ke")) {
    return `${normalizedUrl}?w=${size}&q=15`;
  }

  return normalizedUrl;
};
