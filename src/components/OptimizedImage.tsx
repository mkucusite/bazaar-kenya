import { useState, memo } from "react";
import { optimizeImageUrl } from "@/lib/image-utils";
import logo from "@/assets/kenyaadvert-logo.webp";

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
 * - Branded skeleton/logo placeholder while loading (Jiji-style).
 * - Applies CDN auto-format (WebP/AVIF).
 * - Explicit width/height to prevent CLS.
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
  const optimizedSrc = optimizeImageUrl(src, width, height);
  const showPlaceholder = !loaded || errored;

  return (
    <span className="relative block w-full h-full overflow-hidden">
      {showPlaceholder && (
        <span
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted via-muted/70 to-muted animate-pulse"
          aria-hidden="true"
        >
          <img
            src={logo}
            alt=""
            className="w-12 h-12 opacity-25"
            width={48}
            height={48}
            loading="eager"
          />
        </span>
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        sizes={sizes}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className} relative ${loaded && !errored ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        style={{ contentVisibility: loading === "lazy" ? "auto" : undefined }}
      />
    </span>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
