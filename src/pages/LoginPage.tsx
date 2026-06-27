import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/kenyaadvert-logo.webp";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import { useRateLimit } from "@/hooks/use-rate-limit";
import { logAuthEvent, isValidEmail } from "@/lib/security";

const LoginPage = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { checkRateLimit, resetLimit } = useRateLimit();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast({ title: "Invalid email format", variant: "destructive" });
      return;
    }
    const { allowed, resetIn } = checkRateLimit(email);
    if (!allowed) {
      toast({ title: "Too many attempts", description: `Try again in ${Math.ceil(resetIn / 60)} minutes`, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      logAuthEvent("login_failed", email);
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      resetLimit(email);
      logAuthEvent("login", email);
      toast({ title: "Welcome back!" });
      navigate(redirectTo);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Login — Sign In to Your Account" description="Sign in to KenyaAdvert to manage your ads, messages, and favourites across all 47 counties." canonical="https://www.kenyaadverts.com/login" robots="noindex, follow" ogImage="https://www.kenyaadverts.com/og/og-login.png" keywords="login KenyaAdvert, sign in Kenya classifieds, KenyaAdvert account login, manage ads Kenya, my account KenyaAdvert, seller login Kenya, buyer login, classifieds sign in" />
      <Navbar />
      <div className="flex items-center justify-center py-8 md:py-14 px-4">
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl grid lg:grid-cols-2 lg:gap-10 lg:items-stretch">
          {/* Brand side panel — visible from tablet up */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-primary to-primary/70 p-10 text-primary-foreground shadow-xl">
            <div>
              <img src="/lovable-uploads/f47ecfaa-1a95-4ab9-8798-087b04ec729e.webp" alt="KenyaAdvert" className="h-12 mb-8" />
              <h2 className="font-heading font-bold text-3xl leading-tight mb-3">Kenya's safest classifieds — welcome back.</h2>
              <p className="text-sm text-primary-foreground/85 leading-relaxed">Manage your ads, chat with buyers, and grow your business across all 47 counties.</p>
            </div>
            <ul className="mt-10 space-y-3 text-sm">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> Free to post</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> Verified sellers</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> Local M-Pesa payments</li>
            </ul>
          </div>

          <div className="w-full max-w-md mx-auto lg:max-w-none">
          <div className="text-center mb-6 lg:hidden">
            <img alt="KenyaAdvert" className="h-14 mx-auto mb-3" src="/lovable-uploads/f47ecfaa-1a95-4ab9-8798-087b04ec729e.webp" />
          </div>
          <div className="hidden lg:block mb-6">
            <h1 className="font-heading font-bold text-3xl text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your KenyaAdvert account</p>
          </div>
          <div className="lg:hidden text-center mb-4">
            <h1 className="font-heading font-bold text-2xl text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your KenyaAdvert account</p>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-10" required />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {toast({ title: "Enter your email first", variant: "destructive" });return;}
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`
                    });
                    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });else
                    toast({ title: "Check your email", description: "We sent you a password reset link." });
                  }}
                  className="text-[11px] text-primary hover:underline">
                  
                  Forgot password?
                </button>
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[11px] uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
            </div>

            <Button
              variant="outline"
              className="w-full h-10"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error } = await signInWithGoogle(redirectTo);
                  if (error) {
                    console.error("Google sign-in error:", error);
                    toast({ title: "Google sign-in failed", description: String(error.message || error), variant: "destructive" });
                  }
                } catch (err: any) {
                  console.error("Google sign-in exception:", err);
                  toast({ title: "Google sign-in failed", description: "Something went wrong. Please try again.", variant: "destructive" });
                } finally {
                  setLoading(false);
                }
              }}>

              
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Continue with Google
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
          </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>);

};

export default LoginPage;