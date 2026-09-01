import { Link, useLocation } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  title?: string;
  message?: string;
  children: React.ReactNode;
}

/**
 * Wraps any page that writes to the database.
 * Everything published on KenyaAdvert is tied to a real account.
 */
const AuthGate = ({ title = "Sign in to continue", message, children }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname + location.search);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-app flex max-w-lg flex-col items-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message ||
            "Listings on KenyaAdvert belong to real people. Sign in so you can edit, boost and get enquiries for what you publish — it takes seconds and it is free."}
        </p>
        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            to={`/login?redirect=${redirect}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Link>
          <Link
            to={`/register?redirect=${redirect}`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            Create free account
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AuthGate;
