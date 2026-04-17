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

  // Supabase public storage: use image transformation endpoint instead of full original files
  if (url.includes("/storage/v1/object/public/")) {
    const transformedUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(transformedUrl);
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", "75");
    u.searchParams.set("resize", "cover");
    if (height) u.searchParams.set("height", String(height));
    return u.toString();
  }

  // R2/CDN images: pass resize params to Worker
  if (url.includes("cdn.kenyaadverts.co.ke") || url.includes("r2.dev")) {
    const baseUrl = url.includes("r2.dev")
      ? url.replace("https://pub-ee53d01640a84ec3b4f7931c3ae152c3.r2.dev", "https://cdn.kenyaadverts.co.ke")
      : url;
    const params = new URLSearchParams();
    params.set("w", String(width));
    params.set("q", "75");
    if (height) params.set("h", String(height));
    return `${baseUrl}?${params.toString()}`;
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

  if (url.includes("/storage/v1/object/public/")) {
    const transformedUrl = url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(transformedUrl);
    u.searchParams.set("width", String(size));
    u.searchParams.set("quality", "25");
    return u.toString();
  }

  return url;
};
