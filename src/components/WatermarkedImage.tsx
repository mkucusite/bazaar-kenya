import OptimizedImage from "@/components/OptimizedImage";

interface WatermarkedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  logoSize?: "sm" | "md" | "lg";
}

const logoSizes = {
  sm: "w-16 h-auto opacity-70",
  md: "w-24 h-auto opacity-70",
  lg: "w-32 h-auto opacity-70",
};

const WatermarkedImage = ({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  logoSize = "sm",
}: WatermarkedImageProps) => {
  return (
    <div className="relative w-full h-full">
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
      {/* Watermark logo - bottom right */}
      <img
        src="/watermark-logo.png"
        alt="KenyaAdvert"
        className={`absolute bottom-2 right-2 ${logoSizes[logoSize]} pointer-events-none select-none drop-shadow-md`}
        loading="lazy"
      />
    </div>
  );
};

export default WatermarkedImage;
