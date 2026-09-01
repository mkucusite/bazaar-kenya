import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/kenyaadvert-logo.webp";

const DISMISS_KEY = "ka_signin_prompt_dismissed_until";
const HIDE_ROUTES = ["/login", "/register", "/reset-password", "/admin"];

/**
 * Jiji / Google One-Tap-style sign-in prompt.
 * Mobile: full-width bottom sheet pinned above the bottom nav.
 * Desktop: compact card in bottom-right.
 */
const SignInPrompt = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (loading || user) {
      setVisible(false);
      return;
    }
    if (HIDE_ROUTES.some((r) => location.pathname.startsWith(r))) {
      setVisible(false);
      return;
    }
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && Date.now() < until) return;
    } catch {}

    const t = window.setTimeout(() => setVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, [user, loading, location.pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
    setVisible(false);
  };

  const handleGoogle = async () => {
    setSigning(true);
    try {
      await signInWithGoogle();
    } finally {
      setSigning(false);
    }
  };

  if (!visible || user) return null;

  const redirect = encodeURIComponent(location.pathname + location.search);

  return (
    <div
      role="dialog"
      aria-label="Sign in to KenyaAdvert"
      className="fixed inset-x-0 bottom-0 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-card border-t md:border border-border/70 md:rounded-2xl shadow-2xl px-4 pt-4 pb-5 md:pb-4">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <img src={logo} alt="" className="w-9 h-9 rounded-lg flex-shrink-0" width={36} height={36} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              Sign in to KenyaAdvert
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              Save favourites, chat sellers, post free ads.
            </p>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={signing}
          className="w-full h-11 rounded-xl border border-border bg-card hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {signing ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <Link
            to={`/login?redirect=${redirect}`}
            onClick={() => setVisible(false)}
            className="h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            Sign in with email
          </Link>
          <Link
            to={`/register?redirect=${redirect}`}
            onClick={() => setVisible(false)}
            className="h-10 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center"
          >
            Create account
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-3">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default SignInPrompt;
