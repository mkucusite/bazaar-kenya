import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LogoImage from "@/components/LogoImage";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    // Also listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Reset Password — KenyaAdvert" description="Reset your KenyaAdvert account password securely. Recover access to your classifieds account." canonical="https://www.kenyaadverts.com/reset-password" keywords="reset password KenyaAdvert, forgot password Kenya classifieds, recover account, password recovery, KenyaAdvert account help" />
      <Navbar />
      <div className="flex items-center justify-center py-12 md:py-20 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <LogoImage alt="KenyaAdvert" className="h-16 mx-auto mb-4" />
            <h1 className="font-heading font-bold text-2xl text-foreground">Reset Password</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your new password</p>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-6">
            {!isRecovery ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Invalid or expired reset link. Please request a new one from the login page.
              </p>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-xs">New Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-10"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm" className="text-xs">Confirm Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-10" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
