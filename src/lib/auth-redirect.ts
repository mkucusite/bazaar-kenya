/**
 * Post-login redirect helpers.
 *
 * Guarantees that sign-in always returns the user to THIS site (canonical
 * www.kenyaadverts.com in production) and to a sensible page:
 *  - the page they were on before signing in, or
 *  - their account (My Ads) when they started from the homepage / an auth page.
 */

export const CANONICAL_ORIGIN = "https://www.kenyaadverts.com";

const LEGACY_HOSTS = [
  "kenyaadverts.co.ke",
  "www.kenyaadverts.co.ke",
  "kenyaadverts.com",
];

/** Account landing page used when there is no meaningful page to return to. */
export const ACCOUNT_PATH = "/my-ads";

const AUTH_PATHS = ["/login", "/register", "/reset-password", "/auth"];

/** The origin OAuth must come back to — never a legacy/foreign domain. */
export const authOrigin = (): string => {
  if (typeof window === "undefined") return CANONICAL_ORIGIN;
  const host = window.location.hostname;
  if (LEGACY_HOSTS.includes(host)) return CANONICAL_ORIGIN;
  return window.location.origin;
};

/** Normalises a requested redirect into a safe same-site path. */
export const safeRedirectPath = (raw?: string | null): string => {
  let path = (raw || "").trim();

  // Reject absolute URLs / protocol-relative / foreign domains.
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    path = "";
  }

  if (!path || path === "/" || AUTH_PATHS.some((p) => path.startsWith(p))) {
    return ACCOUNT_PATH;
  }
  return path;
};

/** Full absolute URL to hand to the OAuth provider. */
export const authRedirectUrl = (path?: string | null): string =>
  `${authOrigin()}${safeRedirectPath(path)}`;
