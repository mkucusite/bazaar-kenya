/**
 * Image URL helpers for performance optimization.
 * Appends proper sizing/format params to third-party image URLs.
 */

/**
 * For Unsplash images, appends auto=format,compress and adjusts w/h params.
 * For Supabase storage images, returns as-is (already optimized at upload).
 */
export const optimizeImageUrl = (
  url: string | undefined | null,
  width: number = 400,
  height?: number,
): string => {
  if (!url) return "/placeholder.svg";

  // Unsplash: append auto=format for WebP/AVIF delivery + quality
  if (url.includes("unsplash.com")) {
    const u = new URL(url);
    u.searchParams.set("auto", "format,compress");
    u.searchParams.set("q", "60");
    u.searchParams.set("w", String(width));
    if (height) u.searchParams.set("h", String(height));
    u.searchParams.set("fit", "crop");
    return u.toString();
  }

  // R2/CDN images: use Cloudflare Image Resizing
  if (url.includes("cdn.kenyaadverts.co.ke") || url.includes("r2.dev")) {
    const params = [`width=${width}`, `quality=75`, `format=auto`];
    if (height) params.push(`height=${height}`);
    return `https://cdn.kenyaadverts.co.ke/cdn-cgi/image/${params.join(",")}/${url}`;
  }

  return url;
};

/**
 * Generate a tiny blurry placeholder for progressive loading.
 * Returns a small inline data URL for use as CSS background.
 */
export const getPlaceholderUrl = (url: string | undefined | null, size = 20): string => {
  if (!url) return "/placeholder.svg";
  if (url.includes("unsplash.com")) {
    const u = new URL(url);
    u.searchParams.set("w", String(size));
    u.searchParams.set("q", "10");
    u.searchParams.set("blur", "20");
    u.searchParams.set("auto", "format");
    return u.toString();
  }
  return url;
};
