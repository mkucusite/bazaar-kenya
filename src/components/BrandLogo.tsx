import { Link } from "react-router-dom";

interface Props {
  /** compact = monogram only (mobile header), full = monogram + wordmark */
  variant?: "full" | "compact";
  className?: string;
}

/**
 * Typographic brand mark. A sharp monogram tile plus a two-tone wordmark —
 * legible at 24px on a phone header, no washed-out raster logo.
 */
const BrandLogo = ({ variant = "full", className = "" }: Props) => (
  <Link to="/" aria-label="KenyaAdvert home" className={`group flex items-center gap-2.5 ${className}`}>
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary via-emerald-700 to-teal-800 shadow-md ring-1 ring-primary/20 transition-transform group-active:scale-95">
      <span className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-accent/40 blur-[6px]" />
      <span className="relative font-heading text-[15px] font-black leading-none tracking-tight text-primary-foreground">
        KA
      </span>
      <span className="absolute bottom-0 left-0 h-[3px] w-full bg-accent" />
    </span>

    {variant === "full" && (
      <span className="hidden min-w-0 flex-col leading-none sm:flex">
        <span className="font-heading text-[17px] font-extrabold tracking-tight text-foreground">
          Kenya<span className="text-primary">Advert</span>
        </span>
        <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Buy · Book · Hire · Campaign
        </span>
      </span>
    )}
  </Link>
);

export default BrandLogo;
