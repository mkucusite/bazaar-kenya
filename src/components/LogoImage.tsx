import lightLogo from "@/assets/kenyaadvert-mark.png";
import darkLogo from "@/assets/kenyaadvert-mark-dark.png";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** crop to the emblem only (square icon usage) */
  className?: string;
};

/**
 * Transparent brand logo that follows the active theme:
 * light artwork in light mode, mint wordmark variant in dark mode.
 */
const LogoImage = ({ className = "", alt = "KenyaAdvert", ...rest }: Props) => (
  <>
    <img src={lightLogo} alt={alt} className={`${className} dark:hidden`} {...rest} />
    <img src={darkLogo} alt="" aria-hidden="true" className={`hidden ${className} dark:block`} {...rest} />
  </>
);

export default LogoImage;
