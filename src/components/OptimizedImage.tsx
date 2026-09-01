import { useState, memo } from "react";
import { getPlaceholderUrl, optimizeImageUrl } from "@/lib/image-utils";

interface OptimizedImageProps {
  src: string | undefined | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
}

/**
 * Performance-optimized image component.
 * - Tiny LQIP (low-quality image placeholder) blurred while full image loads.
 * - Uses CDN auto-format (WebP/AVIF) via optimizeImageUrl.
 * - Explicit width/height to prevent CLS.
 * - No JS-heavy logo overlay → faster paint.
 */
const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  fetchPriority,
  sizes,
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const optimizedSrc = fallbackSrc || optimizeImageUrl(src, width, height);
  const previewSrc = getPlaceholderUrl(src, 24);
  const showLqip = !loaded && !errored && previewSrc !== "/placeholder.svg" && previewSrc !== src;

  const handleError = () => {
    // If CDN failed and no fallback yet, try the raw src (often a Supabase URL)
    if (!fallbackSrc && src && optimizedSrc.includes("cdn.kenyaadverts.co.ke") && !src.includes("cdn.kenyaadverts.co.ke")) {
      setFallbackSrc(src);
      return;
    }
    if (!fallbackSrc && optimizedSrc.includes("cdn.kenyaadverts.co.ke") && src) {
      // Try rewriting CDN host back to a known Supabase storage URL by stripping query
      try {
        const u = new URL(optimizedSrc);
        u.search = "";
        if (u.toString() !== optimizedSrc) {
          setFallbackSrc(u.toString());
          return;
        }
      } catch {}
    }
    setErrored(true);
  };

  return (
    <span className="relative block w-full h-full overflow-hidden bg-muted">
      {showLqip && (
        <img
          src={previewSrc}
          alt=""
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-md"
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          aria-hidden="true"
        />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        decoding={loading === "eager" ? "sync" : "async"}
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`${className} relative ${loaded && !errored ? "opacity-100" : "opacity-0"} transition-opacity duration-150`}
      />
    </span>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
