import { Link } from "react-router-dom";
import LogoImage from "@/components/LogoImage";

interface Props {
  /** compact = monogram only (mobile header), full = monogram + wordmark */
  variant?: "full" | "compact";
  className?: string;
}

const BrandLogo = ({ variant = "full", className = "" }: Props) => (
  <Link to="/" aria-label="KenyaAdvert home" className={`group inline-flex min-w-0 items-center gap-2 ${className}`}>
    <LogoImage alt="" width={40} height={40} className="h-9 w-9 shrink-0 rounded-md object-cover object-[50%_28%]" />
    {variant === "full" && (
      <span className="truncate font-heading text-[17px] font-black leading-none text-foreground transition-colors group-hover:text-primary sm:text-[20px]">
        Kenya<span className="text-accent">Advert</span>
      </span>
    )}
  </Link>
);

export default BrandLogo;
