/**
 * Image URL helpers for performance optimization.
 * Appends proper sizing/format params to third-party image URLs.
 */

/**
 * Returns a smaller, format-optimized URL for the given image.
 * - Unsplash: appends auto=format,compress with WebP/AVIF delivery.
 * - Supabase storage: routes through the render/image transformation endpoint.
 * - R2 / cdn.kenyaadverts.com: passes resize params to the Worker.
 * Defaults are intentionally aggressive for fast LCP.
 */
export const optimizeImageUrl = (
  url: string | undefined | null,
  width: number = 320,
  height?: number,
): string => {
  if (!url) return "/placeholder.svg";

  const normalizedUrl = url;

  if (normalizedUrl.includes("unsplash.com")) {
    const u = new URL(normalizedUrl);
    u.searchParams.set("auto", "format,compress");
    u.searchParams.set("q", "55");
    u.searchParams.set("w", String(width));
    if (height) u.searchParams.set("h", String(height));
    u.searchParams.set("fit", "crop");
    return u.toString();
  }

  if (normalizedUrl.includes("/storage/v1/object/public/")) {
    const transformedUrl = normalizedUrl.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
    const u = new URL(transformedUrl);
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", "65");
    u.searchParams.set("resize", "cover");
    if (height) u.searchParams.set("height", String(height));
    return u.toString();
  }

  if (normalizedUrl.includes("cdn.kenyaadverts.com") || normalizedUrl.includes("r2.dev")) {
    const baseUrl = normalizedUrl.includes("r2.dev")
      ? normalizedUrl.replace("https://pub-ee53d01640a84ec3b4f7931c3ae152c3.r2.dev", "https://cdn.kenyaadverts.com")
      : normalizedUrl;
    const params = new URLSearchParams();
    params.set("w", String(width));
    params.set("q", "70");
    if (height) params.set("h", String(height));
    return `${baseUrl}?${params.toString()}`;
  }

  return normalizedUrl;
};

/**
 * Tiny blurred placeholder for progressive loading.
 */
export const getPlaceholderUrl = (url: string | undefined | null, size = 24): string => {
  if (!url) return "/placeholder.svg";

  const normalizedUrl = url;

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

  if (normalizedUrl.includes("cdn.kenyaadverts.com") || normalizedUrl.includes("r2.dev")) {
    const baseUrl = normalizedUrl.includes("r2.dev")
      ? normalizedUrl.replace("https://pub-ee53d01640a84ec3b4f7931c3ae152c3.r2.dev", "https://cdn.kenyaadverts.com")
      : normalizedUrl;
    return `${baseUrl}?w=${size}&q=15`;
  }

  return normalizedUrl;
};
