import { useState, useRef, useEffect, memo } from "react";
import { optimizeImageUrl } from "@/lib/image-utils";

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
 * - Uses IntersectionObserver for true lazy loading
 * - Applies Unsplash auto-format (WebP/AVIF)
 * - Shows muted placeholder until loaded
 * - Explicit width/height to prevent CLS
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
  const optimizedSrc = optimizeImageUrl(src, width, height);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      sizes={sizes}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} ${loaded ? "" : "bg-muted animate-pulse"}`}
      style={{ contentVisibility: loading === "lazy" ? "auto" : undefined }}
    />
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
