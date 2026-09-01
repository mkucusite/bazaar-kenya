import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { consumePostAuthRedirect, ACCOUNT_PATH } from "@/lib/auth-redirect";

/**
 * Landing page for OAuth returns. Waits for the session to hydrate on this
 * origin, then sends the user to wherever they were before signing in.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const target = consumePostAuthRedirect();
    navigate(user ? target : `/login?redirect=${encodeURIComponent(target === ACCOUNT_PATH ? ACCOUNT_PATH : target)}`, {
      replace: true,
    });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="w-7 h-7 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
};

export default AuthCallbackPage;
