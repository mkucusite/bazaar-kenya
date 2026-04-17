import { useState, memo } from "react";
import { getPlaceholderUrl, optimizeImageUrl } from "@/lib/image-utils";
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
  const previewSrc = getPlaceholderUrl(src, 40);
  const showPlaceholder = !loaded || errored;

  return (
    <span className="relative block w-full h-full overflow-hidden bg-muted">
      {!loaded && !errored && previewSrc !== "/placeholder.svg" && (
        <img
          src={previewSrc}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-lg"
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          aria-hidden="true"
        />
      )}
      {showPlaceholder && (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <img
            src={logo}
            alt=""
            className="w-10 h-10 opacity-30"
            width={40}
            height={40}
            loading="eager"
            decoding="async"
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
        // @ts-expect-error fetchpriority is a valid HTML attribute
        fetchpriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`${className} relative ${loaded && !errored ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
      />
    </span>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;
