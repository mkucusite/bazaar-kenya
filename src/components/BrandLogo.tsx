import { Link } from "react-router-dom";

interface Props {
  /** compact = monogram only (mobile header), full = monogram + wordmark */
  variant?: "full" | "compact";
  className?: string;
}

const BrandLogo = ({ variant = "full", className = "" }: Props) => (
  <Link to="/" aria-label="KenyaAdvert home" className={`group inline-flex items-center ${className}`}>
    <span className="font-heading text-[18px] font-black leading-none text-foreground transition-colors group-hover:text-primary sm:text-[21px]">
      KENYA<span className="text-primary">ADVERT</span>
    </span>
    {variant === "full" && <span className="ml-2 hidden h-1.5 w-1.5 rounded-full bg-accent lg:block" />}
  </Link>
);

export default BrandLogo;
