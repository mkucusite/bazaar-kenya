import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeAlert, Loader2, ShieldCheck, ShieldX, Wallet, Users, BarChart3, Bot, RefreshCw, Sparkles, FileText, Lock, Lightbulb } from "lucide-react";
import AdminAIChat from "@/components/admin/AdminAIChat";
import AdminPageEditor from "@/components/admin/AdminPageEditor";
import { toast } from "@/hooks/use-toast";
import { getAdPath } from "@/lib/ad-links";
import { motion, AnimatePresence } from "framer-motion";

type ReportRow = {
  id: string;
  ad_id: string;
  reason: string;
  status: string;
  ai_label: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  created_at: string;
  ads: { id: string; title: string; status: string | null } | null;
};

type AlertRequestRow = {
  id: string;
  user_id: string;
  keyword: string;
  category: string | null;
  county: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

type CategorySuggestionRow = {
  id: string;
  user_id: string;
  category_name: string;
  parent_category_id: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

type UserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
  is_verified: boolean | null;
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: BadgeAlert },
  { id: "users", label: "Users", icon: Users },
  { id: "alerts", label: "Alerts", icon: ShieldCheck },
  { id: "categories", label: "Categories", icon: Lightbulb },
  { id: "credits", label: "Credits", icon: Wallet },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
];

const ADMIN_PIN = "9713";

const AdminPage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loadingAdmin } = useAdmin();
  const navigate = useNavigate();

  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [alertRequests, setAlertRequests] = useState<AlertRequestRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [catSuggestions, setCatSuggestions] = useState<CategorySuggestionRow[]>([]);
  const [stats, setStats] = useState({ totalAds: 0, activeAds: 0, pendingReports: 0, totalUsers: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const [creditsUserId, setCreditsUserId] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const loadAdminData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setPageLoading(true);

    const [reportsRes, requestsRes, adsRes, usersRes] = await Promise.all([
      supabase
        .from("ad_reports")
        .select("id,ad_id,reason,status,ai_label,ai_summary,ai_confidence,created_at,ads(id,title,status)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("alert_requests")
        .select("id,user_id,keyword,category,county,note,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("ads").select("id,status"),
      supabase.from("profiles").select("id,full_name,phone,created_at,is_verified").order("created_at", { ascending: false }).limit(200),
    ]);

    if (reportsRes.error || requestsRes.error || adsRes.error) {
      toast({ title: "Failed to load admin data", variant: "destructive" });
      setPageLoading(false);
      return;
    }

    const ads = adsRes.data || [];
    const profileData = (usersRes.data || []) as UserRow[];
    setReports((reportsRes.data as ReportRow[]) || []);
    setAlertRequests((requestsRes.data as AlertRequestRow[]) || []);
    setUsers(profileData);
    setStats({
      totalAds: ads.length,
      activeAds: ads.filter((ad) => ad.status === "active").length,
      pendingReports: (reportsRes.data || []).filter((row) => row.status === "pending" || row.status === "needs_review").length,
      totalUsers: profileData.length,
    });
    setPageLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!loadingAdmin && isAdmin) loadAdminData();
  }, [loadingAdmin, isAdmin, loadAdminData]);

  const handleAIModerate = async (reportId: string) => {
    setModeratingId(reportId);
    try {
      const { data, error } = await supabase.functions.invoke("moderate-reported-ad", {
        body: { report_id: reportId },
      });
      if (error) throw error;
      toast({ title: `AI verdict: ${data?.decision?.label || "unknown"}`, description: data?.decision?.summary });
      await loadAdminData();
    } catch (err: any) {
      toast({ title: "AI moderation failed", description: err.message, variant: "destructive" });
    } finally {
      setModeratingId(null);
    }
  };

  const handleSetAdStatus = async (adId: string, status: "active" | "pending") => {
    setSaving(true);
    const { error } = await supabase.from("ads").update({ status, updated_at: new Date().toISOString() }).eq("id", adId);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update ad", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "pending" ? "Ad deactivated" : "Ad reactivated" });
    await loadAdminData();
  };

  const handleResolveReport = async (reportId: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("ad_reports")
      .update({ status: "resolved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", reportId);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update report", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report marked as resolved" });
    await loadAdminData();
  };

  const handleAlertRequestStatus = async (row: AlertRequestRow, status: "approved" | "rejected") => {
    if (!user) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from("alert_requests")
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", row.id);

    if (!updateError && status === "approved") {
      await supabase.from("alerts").insert({
        user_id: row.user_id,
        keyword: row.keyword,
        category: row.category,
        county: row.county,
        is_active: true,
      });
    }
    setSaving(false);
    if (updateError) {
      toast({ title: "Failed to review request", description: updateError.message, variant: "destructive" });
      return;
    }
    toast({ title: `Request ${status}` });
    await loadAdminData();
  };

  const handleUpdateCredits = async () => {
    if (!creditsUserId.trim() || !creditsAmount.trim()) return;
    const nextBalance = Number(creditsAmount);
    if (Number.isNaN(nextBalance) || nextBalance < 0) {
      toast({ title: "Enter a valid credit amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: existing } = await supabase.from("credits").select("id").eq("user_id", creditsUserId.trim()).maybeSingle();
    const { error } = existing
      ? await supabase.from("credits").update({ balance: nextBalance, updated_at: new Date().toISOString() }).eq("user_id", creditsUserId.trim())
      : await supabase.from("credits").insert({ user_id: creditsUserId.trim(), balance: nextBalance });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update credits", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Credits updated" });
    setCreditsAmount("");
  };

  const pendingReports = useMemo(() => reports.filter((r) => r.status !== "resolved"), [reports]);

  if (loading || loadingAdmin || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-16">
          <div className="max-w-xl mx-auto text-center bg-card border border-border/60 rounded-2xl p-8">
            <ShieldX className="w-10 h-10 mx-auto text-destructive mb-3" />
            <h1 className="font-heading text-2xl text-foreground mb-2">Admin access required</h1>
            <p className="text-muted-foreground text-sm">You do not have permission to view this page.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // PIN verification gate
  if (!pinVerified) {
    const verifyPin = () => {
      if (pinInput === ADMIN_PIN) {
        setPinVerified(true);
        setPinError(false);
      } else {
        setPinError(true);
      }
    };
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-16">
          <div className="max-w-sm mx-auto text-center bg-card border border-border/60 rounded-2xl p-8">
            <Lock className="w-10 h-10 mx-auto text-primary mb-3" />
            <h1 className="font-heading text-xl text-foreground mb-2">Admin Verification</h1>
            <p className="text-muted-foreground text-xs mb-4">Enter your security PIN to continue</p>
            <form onSubmit={(e) => { e.preventDefault(); verifyPin(); }} className="space-y-3">
              <Input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                placeholder="Enter PIN"
                className={`h-10 text-center text-lg tracking-widest ${pinError ? "border-destructive" : ""}`}
                maxLength={10}
                autoFocus
              />
              {pinError && <p className="text-xs text-destructive">Incorrect PIN. Try again.</p>}
              <Button type="submit" className="w-full h-10">Verify</Button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const getLabelColor = (label: string | null) => {
    if (label === "unsafe") return "bg-destructive/10 text-destructive";
    if (label === "safe") return "bg-primary/10 text-primary";
    return "bg-accent/20 text-accent-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Admin Panel</h1>
          <Button variant="outline" size="sm" onClick={loadAdminData} disabled={pageLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${pageLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Mobile-friendly scrollable tabs */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "reports" && stats.pendingReports > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                  {stats.pendingReports}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Ads", value: stats.totalAds, color: "text-foreground" },
                  { label: "Active Ads", value: stats.activeAds, color: "text-primary" },
                  { label: "Pending Reports", value: stats.pendingReports, color: "text-destructive" },
                  { label: "Users", value: stats.totalUsers, color: "text-foreground" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* REPORTS */}
            {activeTab === "reports" && (
              <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                <h2 className="font-heading font-semibold text-base flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4" /> Reported Ads
                </h2>
                {pageLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : pendingReports.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No pending reports.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map((row) => (
                      <div key={row.id} className="border border-border/60 rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{row.ads?.title || "Unknown ad"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{row.reason}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {row.ai_label && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getLabelColor(row.ai_label)}`}>
                                {row.ai_label} {row.ai_confidence ? `(${Math.round(row.ai_confidence * 100)}%)` : ""}
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{row.status}</span>
                          </div>
                        </div>
                        {row.ai_summary && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">AI: {row.ai_summary}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {!row.ai_label && row.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAIModerate(row.id)}
                              disabled={moderatingId === row.id}
                              className="text-xs h-7"
                            >
                              {moderatingId === row.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />}
                              AI Review
                            </Button>
                          )}
                          {row.ads?.id && (
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate(getAdPath({ id: row.ads!.id, title: row.ads!.title }))}>
                              Open
                            </Button>
                          )}
                          {row.ads?.id && row.ads.status !== "pending" && (
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleSetAdStatus(row.ads!.id, "pending")} disabled={saving}>
                              Deactivate
                            </Button>
                          )}
                          {row.ads?.id && row.ads.status === "pending" && (
                            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleSetAdStatus(row.ads!.id, "active")} disabled={saving}>
                              Reactivate
                            </Button>
                          )}
                          <Button size="sm" className="text-xs h-7" onClick={() => handleResolveReport(row.id)} disabled={saving}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                <h2 className="font-heading font-semibold text-base flex items-center gap-2">
                  <Users className="w-4 h-4" /> Platform Users ({users.length})
                </h2>
                {pageLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No users found.</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((u) => (
                      <div key={u.id} className="border border-border/60 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{u.full_name || "No name"}</p>
                          <p className="text-xs text-muted-foreground">{u.phone || "No phone"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {u.is_verified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Verified</span>
                          )}
                          <button
                            onClick={() => {
                              setCreditsUserId(u.id);
                              setActiveTab("credits");
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                          >
                            Credits
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALERTS */}
            {activeTab === "alerts" && (
              <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                <h2 className="font-heading font-semibold text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Alert Requests
                </h2>
                {alertRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No alert requests yet.</p>
                ) : (
                  <div className="space-y-2">
                    {alertRequests.map((row) => (
                      <div key={row.id} className="border border-border/60 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground">{row.keyword}</p>
                            <p className="text-[10px] text-muted-foreground truncate">User: {row.user_id.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">{[row.category, row.county].filter(Boolean).join(" • ") || "Any"}</p>
                            {row.note && <p className="text-xs text-muted-foreground mt-1">{row.note}</p>}
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{row.status}</span>
                        </div>
                        {row.status === "pending" && (
                          <div className="flex gap-1.5">
                            <Button size="sm" className="text-xs h-7" onClick={() => handleAlertRequestStatus(row, "approved")} disabled={saving}>Approve</Button>
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleAlertRequestStatus(row, "rejected")} disabled={saving}>Reject</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CREDITS */}
            {activeTab === "credits" && (
              <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                <h2 className="font-heading font-semibold text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Credits Manager
                </h2>
                <div className="space-y-2">
                  <Input value={creditsUserId} onChange={(e) => setCreditsUserId(e.target.value)} placeholder="User UUID" className="h-10" />
                  <Input value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)} placeholder="New credit balance" type="number" className="h-10" />
                  <Button onClick={handleUpdateCredits} disabled={saving} className="w-full h-10">Update Credits</Button>
                </div>
              </div>
            )}

            {/* PAGES EDITOR */}
            {activeTab === "pages" && (
              <div className="bg-card border border-border/60 rounded-2xl p-4">
                <AdminPageEditor />
              </div>
            )}

            {/* AI ASSISTANT */}
            {activeTab === "ai" && <AdminAIChat />}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;
