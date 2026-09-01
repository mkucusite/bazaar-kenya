/**
 * Post-login redirect helpers.
 *
 * Rules:
 * - If the user was on a real page before signing in, send them back there.
 * - If they came from the homepage (or straight to /login), send them to their account.
 * - Never trust an external URL — only same-origin paths are ever used.
 */

const STORAGE_KEY = "ka:post-auth-redirect";

export const ACCOUNT_PATH = "/my-ads";

const BLOCKED_PREFIXES = ["/login", "/register", "/reset-password", "/auth/callback"];

/** Only allow internal paths like "/ads/foo?x=1". Anything else falls back to the account page. */
export const sanitizeRedirect = (value: string | null | undefined): string => {
  if (!value) return ACCOUNT_PATH;
  let path = value.trim();

  // Reject absolute/protocol-relative URLs unless they point at this exact origin.
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      if (url.origin !== window.location.origin) return ACCOUNT_PATH;
      path = `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return ACCOUNT_PATH;
    }
  }

  if (!path.startsWith("/") || path.startsWith("//")) return ACCOUNT_PATH;
  if (path === "/") return ACCOUNT_PATH;
  if (BLOCKED_PREFIXES.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`))) {
    return ACCOUNT_PATH;
  }
  return path;
};

export const storePostAuthRedirect = (path: string) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, sanitizeRedirect(path));
  } catch {
    /* storage unavailable — fall back to account page */
  }
};

export const consumePostAuthRedirect = (): string => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return sanitizeRedirect(stored);
  } catch {
    return ACCOUNT_PATH;
  }
};
