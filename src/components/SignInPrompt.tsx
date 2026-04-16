import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { X, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/kenyaadvert-logo.webp";

const DISMISS_KEY = "ka_signin_prompt_dismissed_until";
const HIDE_ROUTES = ["/login", "/register", "/reset-password", "/admin"];

/**
 * Bottom sign-in prompt (Jiji/Google One-Tap style).
 * Shown to logged-out visitors after a short delay.
 * Dismissible — hidden for 24 hours after dismissal.
 */
const SignInPrompt = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

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

  if (!visible || user) return null;

  const redirect = encodeURIComponent(location.pathname + location.search);

  return (
    <div
      role="dialog"
      aria-label="Sign in to KenyaAdvert"
      className="fixed bottom-3 left-3 right-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-card border border-border/70 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <img src={logo} alt="" className="w-10 h-10 rounded-lg flex-shrink-0" width={40} height={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Sign in to KenyaAdvert</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Save favourites, message sellers, and post free ads.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Link
              to={`/login?redirect=${redirect}`}
              onClick={() => setVisible(false)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign in
            </Link>
            <Link
              to={`/register?redirect=${redirect}`}
              onClick={() => setVisible(false)}
              className="inline-flex items-center h-8 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss sign-in prompt"
          className="p-1 -mr-1 -mt-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SignInPrompt;
