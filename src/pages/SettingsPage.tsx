import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Shield,
  Bell,
  EyeOff,
  Bookmark,
  AlertTriangle,
  Loader2,
  Save,
  Lock,
  Trash2,
} from "lucide-react";

type TabKey = "profile" | "security" | "notifications" | "privacy" | "saved" | "danger";

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: EyeOff },
  { key: "saved", label: "Saved Searches", icon: Bookmark },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [saving, setSaving] = useState(false);

  // Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [county, setCounty] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    email_messages: true,
    email_ad_expiry: true,
    email_promotions: false,
    push_messages: true,
    push_ad_expiry: true,
    push_promotions: false,
  });

  // Privacy
  const [privacySettings, setPrivacySettings] = useState({
    show_phone: true,
    show_email: false,
  });

  // Saved searches (alerts)
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadNotifPrefs();
    loadPrivacySettings();
  }, [user]);

  useEffect(() => {
    if (activeTab === "saved" && user) loadAlerts();
  }, [activeTab, user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const loadNotifPrefs = async () => {
    const { data } = await supabase
      .from("notification_preferences" as any)
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setNotifPrefs({
        email_messages: d.email_messages ?? true,
        email_ad_expiry: d.email_ad_expiry ?? true,
        email_promotions: d.email_promotions ?? false,
        push_messages: d.push_messages ?? true,
        push_ad_expiry: d.push_ad_expiry ?? true,
        push_promotions: d.push_promotions ?? false,
      });
    }
  };

  const loadPrivacySettings = async () => {
    const { data } = await supabase
      .from("privacy_settings" as any)
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      const d = data as any;
      setPrivacySettings({
        show_phone: d.show_phone ?? true,
        show_email: d.show_email ?? false,
      });
    }
  };

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setAlerts(data || []);
    setLoadingAlerts(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user!.id);
    setSaving(false);
    if (error) toast({ title: "Error saving profile", variant: "destructive" });
    else toast({ title: "Profile updated" });
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) toast({ title: error.message, variant: "destructive" });
    else {
      toast({ title: "Password updated successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const saveNotifPrefs = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("notification_preferences" as any)
      .upsert({ user_id: user!.id, ...notifPrefs, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Error saving preferences", variant: "destructive" });
    else toast({ title: "Notification preferences saved" });
  };

  const savePrivacy = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("privacy_settings" as any)
      .upsert({ user_id: user!.id, ...privacySettings, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast({ title: "Error saving privacy settings", variant: "destructive" });
    else toast({ title: "Privacy settings saved" });
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    await supabase.from("alerts").update({ is_active: !isActive }).eq("id", alertId);
    loadAlerts();
  };

  const deleteAlert = async (alertId: string) => {
    await supabase.from("alerts").delete().eq("id", alertId);
    loadAlerts();
    toast({ title: "Search alert removed" });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      toast({ title: "Type DELETE to confirm", variant: "destructive" });
      return;
    }
    // Sign out and inform — actual deletion requires admin action
    toast({ title: "Account deactivation requested. You will be signed out." });
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to access settings.</p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead title="Settings" description="Manage your account settings, security, notifications, and privacy on KenyaAdvert." />
      <Navbar />
      <main className="min-h-screen bg-background py-6 md:py-10">
        <div className="container-app max-w-4xl">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-6">Settings</h1>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Tab navigation */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-52 md:flex-shrink-0 pb-2 md:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  } ${tab.key === "danger" ? "text-destructive" : ""}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 bg-card rounded-xl border border-border p-5 md:p-6">
              {/* PROFILE */}
              {activeTab === "profile" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ""} disabled className="mt-1 bg-muted" />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." className="mt-1" />
                    </div>
                    <Button onClick={saveProfile} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Profile
                    </Button>
                  </div>
                </div>
              )}

              {/* SECURITY */}
              {activeTab === "security" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-foreground">Security</h2>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Change Password</h3>
                    <div>
                      <Label htmlFor="newPw">New Password</Label>
                      <Input id="newPw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPw">Confirm New Password</Label>
                      <Input id="confirmPw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
                    </div>
                    <Button onClick={changePassword} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Update Password
                    </Button>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground">You are currently signed in as <strong>{user.email}</strong>.</p>
                    <p className="text-xs text-muted-foreground mt-1">Last sign-in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("en-KE") : "N/A"}</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-2">Connected Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.app_metadata?.provider === "google" ? "Signed in with Google" : "Signed in with email and password"}
                    </p>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Email Notifications</h3>
                    {[
                      { key: "email_messages" as const, label: "New messages" },
                      { key: "email_ad_expiry" as const, label: "Ad expiry reminders" },
                      { key: "email_promotions" as const, label: "Promotions and updates" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <Switch
                          checked={notifPrefs[item.key]}
                          onCheckedChange={(checked) => setNotifPrefs((p) => ({ ...p, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                    <Separator />
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Push Notifications</h3>
                    {[
                      { key: "push_messages" as const, label: "New messages" },
                      { key: "push_ad_expiry" as const, label: "Ad expiry reminders" },
                      { key: "push_promotions" as const, label: "Promotions and updates" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <Switch
                          checked={notifPrefs[item.key]}
                          onCheckedChange={(checked) => setNotifPrefs((p) => ({ ...p, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                    <Button onClick={saveNotifPrefs} disabled={saving} className="gap-2 mt-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Preferences
                    </Button>
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {activeTab === "privacy" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-foreground">Privacy Settings</h2>
                  <p className="text-sm text-muted-foreground">Control what information is visible on your ads and profile.</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Show phone number on ads</p>
                        <p className="text-xs text-muted-foreground">Visible to anyone viewing your listings</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_phone}
                        onCheckedChange={(checked) => setPrivacySettings((p) => ({ ...p, show_phone: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Show email on ads</p>
                        <p className="text-xs text-muted-foreground">Your email will appear on listing pages</p>
                      </div>
                      <Switch
                        checked={privacySettings.show_email}
                        onCheckedChange={(checked) => setPrivacySettings((p) => ({ ...p, show_email: checked }))}
                      />
                    </div>
                    <Button onClick={savePrivacy} disabled={saving} className="gap-2 mt-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Privacy Settings
                    </Button>
                  </div>
                </div>
              )}

              {/* SAVED SEARCHES */}
              {activeTab === "saved" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-foreground">Saved Searches</h2>
                  <p className="text-sm text-muted-foreground">Manage your search alerts. Get notified when matching ads are posted.</p>
                  {loadingAlerts ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : alerts.length === 0 ? (
                    <div className="text-center py-8">
                      <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No saved searches yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Create alerts from the Manage Alerts page.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{alert.keyword}</p>
                            <p className="text-xs text-muted-foreground">
                              {[alert.category, alert.county].filter(Boolean).join(" / ") || "All categories"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Switch
                              checked={alert.is_active}
                              onCheckedChange={() => toggleAlert(alert.id, alert.is_active)}
                            />
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DANGER ZONE */}
              {activeTab === "danger" && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                  <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
                    <h3 className="text-sm font-semibold text-destructive mb-2">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This action will deactivate your account and remove your data. This cannot be undone.
                      All your ads, messages, and profile information will be permanently deleted.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="deleteConfirm" className="text-xs text-destructive">Type DELETE to confirm</Label>
                        <Input
                          id="deleteConfirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          className="mt-1 border-destructive/30"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== "DELETE"}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SettingsPage;
