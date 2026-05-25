import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BadgeAlert, Loader2, ShieldCheck, ShieldX, Wallet, Users, BarChart3, Bot,
  RefreshCw, Sparkles, FileText, Lock, Lightbulb, LogOut, Shield, Activity,
  Ban, Eye, Clock, AlertTriangle, Search as SearchIcon, DollarSign, CreditCard,
  Megaphone, PenTool, Menu, X, Image, Settings, Trash2, ExternalLink,
  HardDrive, Wand2, Download
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminAIChat from "@/components/admin/AdminAIChat";
import AdminPageEditor from "@/components/admin/AdminPageEditor";
import AdminSEO from "@/components/admin/AdminSEO";
import AdminPricing from "@/components/admin/AdminPricing";
import AdminPaymentProvider from "@/components/admin/AdminPaymentProvider";
import AdminBlogGenerator from "@/components/admin/AdminBlogGenerator";
import AdminStorageCDN from "@/components/admin/AdminStorageCDN";
import AdminAIGenerator from "@/components/admin/AdminAIGenerator";
import AdminIndexing from "@/components/admin/AdminIndexing";
import AdminDigitalProducts from "@/components/admin/AdminDigitalProducts";
import { toast } from "@/hooks/use-toast";
import { getAdPath } from "@/lib/ad-links";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/kenyaadvert-logo.webp";

type ReportRow = {
  id: string; ad_id: string; reason: string; status: string;
  ai_label: string | null; ai_summary: string | null; ai_confidence: number | null;
  created_at: string; ads: { id: string; title: string; status: string | null } | null;
};
type AlertRequestRow = {
  id: string; user_id: string; keyword: string; category: string | null;
  county: string | null; note: string | null; status: string; created_at: string;
};
type CategorySuggestionRow = {
  id: string; user_id: string; category_name: string;
  parent_category_id: string | null; note: string | null; status: string; created_at: string;
};
type UserRow = {
  id: string; full_name: string | null; phone: string | null;
  created_at: string | null; is_verified: boolean | null;
};
type LoginLog = {
  id: string; user_id: string | null; email: string | null;
  ip_address: string | null; user_agent: string | null;
  event_type: string; created_at: string;
};
type IpBlock = {
  id: string; ip_address: string; reason: string | null;
  created_at: string; expires_at: string | null;
};
type PaymentRow = {
  id: string; user_id: string | null; amount: number; phone_number: string;
  package_type: string | null; payment_status: string | null; mpesa_code: string | null;
  transaction_id: string | null; created_at: string | null;
  ad_id: string | null; ads: { title: string } | null; profiles: { full_name: string | null } | null;
};
type AdvRequestRow = {
  id: string; business_name: string; contact_person: string; phone: string;
  email: string; preferred_package: string; message: string | null;
  status: string; note: string | null; created_at: string;
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "campaigns", label: "Campaigns", icon: Image },
  { id: "seo", label: "SEO", icon: SearchIcon },
  { id: "indexing", label: "Indexing", icon: Activity },
  { id: "reports", label: "Reports", icon: BadgeAlert },
  { id: "users", label: "Users", icon: Users },
  { id: "security", label: "Security", icon: Shield },
  { id: "login-logs", label: "Login Logs", icon: Activity },
  { id: "alerts", label: "Alerts", icon: ShieldCheck },
  { id: "categories", label: "Categories", icon: Lightbulb },
  { id: "credits", label: "Credits", icon: Wallet },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "digital", label: "Digital Store", icon: Download },
  { id: "advertisers", label: "Advertisers", icon: Megaphone },
  { id: "storage", label: "Storage & CDN", icon: HardDrive },
  { id: "ai-generator", label: "AI Generator", icon: Wand2 },
  { id: "payhero", label: "PayHero Settings", icon: Settings },
  { id: "blog", label: "Blog Generator", icon: PenTool },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
];

const ADMIN_PIN = "9713";

const AdminPage = () => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin, loadingAdmin } = useAdmin();
  const navigate = useNavigate();

  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [alertRequests, setAlertRequests] = useState<AlertRequestRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [catSuggestions, setCatSuggestions] = useState<CategorySuggestionRow[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [ipBlocks, setIpBlocks] = useState<IpBlock[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [advRequests, setAdvRequests] = useState<AdvRequestRow[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [stats, setStats] = useState({ totalAds: 0, activeAds: 0, pendingReports: 0, totalUsers: 0, failedLogins24h: 0, blockedIps: 0, totalPayments: 0, totalRevenue: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [creditsUserId, setCreditsUserId] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("");
  const [newBlockIp, setNewBlockIp] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [phUsername, setPhUsername] = useState("");
  const [phPassword, setPhPassword] = useState("");
  const [phChannel, setPhChannel] = useState("");
  const [phSaving, setPhSaving] = useState(false);

  const loadAdminData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setPageLoading(true);

    const now24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [reportsRes, requestsRes, adsRes, usersRes, catSugRes, logsRes, blocksRes, paymentsRes, advReqRes, campaignsRes] = await Promise.all([
      supabase.from("ad_reports").select("id,ad_id,reason,status,ai_label,ai_summary,ai_confidence,created_at,ads(id,title,status)").order("created_at", { ascending: false }).limit(100),
      supabase.from("alert_requests").select("id,user_id,keyword,category,county,note,status,created_at").order("created_at", { ascending: false }).limit(100),
      supabase.from("ads").select("id,status"),
      supabase.from("profiles").select("id,full_name,phone,created_at,is_verified").order("created_at", { ascending: false }).limit(200),
      supabase.from("category_suggestions" as any).select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("login_logs" as any).select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("ip_blocks" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("id,user_id,amount,phone_number,package_type,payment_status,mpesa_code,transaction_id,created_at,ad_id,ads(title)").order("created_at", { ascending: false }).limit(500),
      supabase.from("advertiser_requests" as any).select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("banner_campaigns" as any).select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const ads = adsRes.data || [];
    const profileData = (usersRes.data || []) as UserRow[];
    const logs = ((logsRes.data || []) as any) as LoginLog[];
    const blocks = ((blocksRes.data || []) as any) as IpBlock[];
    const failedLogins24h = logs.filter(l => l.event_type === "login_failed" && l.created_at > now24h).length;

    // Map payments with profile names
    const profileMap = new Map(profileData.map(p => [p.id, p.full_name]));
    const paymentData = ((paymentsRes.data || []) as any[]).map((p: any) => ({
      ...p,
      profiles: { full_name: profileMap.get(p.user_id) || null },
    })) as PaymentRow[];

    setReports((reportsRes.data as ReportRow[]) || []);
    setAlertRequests((requestsRes.data as AlertRequestRow[]) || []);
    setUsers(profileData);
    setCatSuggestions(((catSugRes.data || []) as any) as CategorySuggestionRow[]);
    setLoginLogs(logs);
    setIpBlocks(blocks);
    setPayments(paymentData);
    setAdvRequests(((advReqRes.data || []) as any) as AdvRequestRow[]);
    setCampaigns(((campaignsRes.data || []) as any) as any[]);
    const completedPayments = paymentData.filter(p => p.payment_status === "completed");
    setStats({
      totalAds: ads.length,
      activeAds: ads.filter(a => a.status === "active").length,
      pendingReports: (reportsRes.data || []).filter(r => r.status === "pending" || r.status === "needs_review").length,
      totalUsers: profileData.length,
      failedLogins24h,
      blockedIps: blocks.length,
      totalPayments: paymentData.length,
      totalRevenue: completedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    });
    setPageLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAdmin]);

  useEffect(() => {
    if (!loadingAdmin && isAdmin && user) loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAdmin, isAdmin]);

  const handleAIModerate = async (reportId: string) => {
    setModeratingId(reportId);
    try {
      const { data, error } = await supabase.functions.invoke("moderate-reported-ad", { body: { report_id: reportId } });
      if (error) throw error;
      toast({ title: `AI verdict: ${data?.decision?.label || "unknown"}`, description: data?.decision?.summary });
      await loadAdminData();
    } catch (err: any) {
      toast({ title: "AI moderation failed", description: err.message, variant: "destructive" });
    } finally { setModeratingId(null); }
  };

  const handleSetAdStatus = async (adId: string, status: "active" | "pending") => {
    setSaving(true);
    const { error } = await supabase.from("ads").update({ status, updated_at: new Date().toISOString() }).eq("id", adId);
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: status === "pending" ? "Ad deactivated" : "Ad reactivated" });
    await loadAdminData();
  };

  const handleResolveReport = async (reportId: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("ad_reports").update({ status: "resolved", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", reportId);
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Report resolved" });
    await loadAdminData();
  };

  const handleAlertRequestStatus = async (row: AlertRequestRow, status: "approved" | "rejected") => {
    if (!user) return;
    setSaving(true);
    const { error: updateError } = await supabase.from("alert_requests").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", row.id);
    if (!updateError && status === "approved") {
      await supabase.from("alerts").insert({ user_id: row.user_id, keyword: row.keyword, category: row.category, county: row.county, is_active: true });
    }
    setSaving(false);
    if (updateError) { toast({ title: "Failed", description: updateError.message, variant: "destructive" }); return; }
    toast({ title: `Request ${status}` });
    await loadAdminData();
  };

  const handleUpdateCredits = async () => {
    if (!creditsUserId.trim() || !creditsAmount.trim()) return;
    const nextBalance = Number(creditsAmount);
    if (Number.isNaN(nextBalance) || nextBalance < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    setSaving(true);
    const { data: existing } = await supabase.from("credits").select("id").eq("user_id", creditsUserId.trim()).maybeSingle();
    const { error } = existing
      ? await supabase.from("credits").update({ balance: nextBalance, updated_at: new Date().toISOString() }).eq("user_id", creditsUserId.trim())
      : await supabase.from("credits").insert({ user_id: creditsUserId.trim(), balance: nextBalance });
    setSaving(false);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Credits updated" });
    setCreditsAmount("");
  };

  const handleBlockIp = async () => {
    if (!newBlockIp.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("ip_blocks" as any).insert({
      ip_address: newBlockIp.trim(),
      reason: newBlockReason.trim() || "Blocked by admin",
      blocked_by: user!.id,
    } as any);
    setSaving(false);
    if (error) { toast({ title: "Failed to block IP", description: error.message, variant: "destructive" }); return; }
    toast({ title: "IP blocked" });
    setNewBlockIp(""); setNewBlockReason("");
    await loadAdminData();
  };

  const handleUnblockIp = async (id: string) => {
    setSaving(true);
    await supabase.from("ip_blocks" as any).delete().eq("id", id);
    setSaving(false);
    toast({ title: "IP unblocked" });
    await loadAdminData();
  };

  const pendingReports = useMemo(() => reports.filter(r => r.status !== "resolved"), [reports]);
  const getLabelColor = (label: string | null) => {
    if (label === "unsafe") return "bg-destructive/10 text-destructive";
    if (label === "safe") return "bg-primary/10 text-primary";
    return "bg-accent/20 text-accent-foreground";
  };

  // Loading state
  if (loading || loadingAdmin || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-sm text-center bg-card border border-border/60 rounded-2xl p-8">
          <ShieldX className="w-10 h-10 mx-auto text-destructive mb-3" />
          <h1 className="font-heading text-2xl text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-4">You do not have admin privileges.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  // PIN gate
  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-sm text-center bg-card border border-border/60 rounded-2xl p-8">
          <Lock className="w-10 h-10 mx-auto text-primary mb-3" />
          <h1 className="font-heading text-xl text-foreground mb-2">Admin Verification</h1>
          <p className="text-muted-foreground text-xs mb-4">Enter your security PIN</p>
          <form onSubmit={(e) => { e.preventDefault(); if (pinInput === ADMIN_PIN) { setPinVerified(true); setPinError(false); } else { setPinError(true); } }} className="space-y-3">
            <Input type="password" inputMode="numeric" pattern="[0-9]*" value={pinInput} onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "")); setPinError(false); }} placeholder="Enter PIN" className={`h-12 text-center text-2xl tracking-[0.3em] ${pinError ? "border-destructive" : ""}`} maxLength={10} autoFocus />
            {pinError && <p className="text-xs text-destructive">Incorrect PIN.</p>}
            <Button type="submit" className="w-full h-10">Verify</Button>
          </form>
        </div>
      </div>
    );
  }

  const SidebarNav = ({ onSelect }: { onSelect?: () => void }) => (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); onSelect?.(); }}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === "reports" && stats.pendingReports > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] text-destructive-foreground">{stats.pendingReports}</span>
            )}
            {tab.id === "security" && stats.failedLogins24h > 5 && (
              <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] text-destructive-foreground">!</span>
            )}
          </button>
        ))}
      </nav>
      <div className="space-y-2 border-t border-border/60 p-4">
        <Button variant="ghost" size="sm" className="h-10 w-full justify-start text-sm" onClick={() => navigate("/")}>
          <Eye className="w-3.5 h-3.5 mr-2" /> View Site
        </Button>
        <Button variant="ghost" size="sm" className="h-10 w-full justify-start text-sm text-destructive" onClick={async () => { await signOut(); navigate("/login"); }}>
          <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-border/60 bg-card md:flex md:flex-col xl:w-80">
        <div className="flex items-center gap-3 border-b border-border/60 p-5">
          <img src={logo} alt="KenyaAdvert" className="h-10" />
          <span className="font-heading text-lg font-bold text-foreground">Admin</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-72 xl:ml-80">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-card px-4 py-4 md:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden p-1.5">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="p-4 border-b border-border/60 flex items-center gap-2">
                  <img src={logo} alt="KenyaAdvert" className="h-8" />
                  <span className="font-heading font-bold text-sm text-foreground">Admin</span>
                </div>
                <SidebarNav onSelect={() => setMobileNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="font-heading text-xl font-bold text-foreground xl:text-2xl">
              {TABS.find(t => t.id === activeTab)?.label || "Admin"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={loadAdminData} disabled={pageLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${pageLoading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </header>

        <div className="max-w-[1400px] p-4 md:p-6 xl:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>

              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3">
                    {[
                      { label: "Total Ads", value: stats.totalAds, icon: BarChart3, color: "text-foreground" },
                      { label: "Active Ads", value: stats.activeAds, icon: Activity, color: "text-primary" },
                      { label: "Pending Reports", value: stats.pendingReports, icon: BadgeAlert, color: "text-destructive" },
                      { label: "Users", value: stats.totalUsers, icon: Users, color: "text-foreground" },
                      { label: "Failed Logins (24h)", value: stats.failedLogins24h, icon: AlertTriangle, color: stats.failedLogins24h > 10 ? "text-destructive" : "text-muted-foreground" },
                      { label: "Blocked IPs", value: stats.blockedIps, icon: Ban, color: "text-muted-foreground" },
                      { label: "Total Payments", value: stats.totalPayments, icon: CreditCard, color: "text-foreground" },
                      { label: "Revenue (KSh)", value: stats.totalRevenue.toLocaleString(), icon: DollarSign, color: "text-primary" },
                    ].map((s) => (
                      <div key={s.label} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 xl:p-6">
                        <s.icon className={`mt-0.5 h-6 w-6 ${s.color}`} />
                        <div>
                          <p className="text-sm text-muted-foreground">{s.label}</p>
                          <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        </div>
                      </div>
                    ))}
                   </div>

                   {/* Quick Links */}
                   <div className="bg-card border border-border/60 rounded-xl p-4">
                     <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><SearchIcon className="w-4 h-4" /> SEO & Sitemap</h3>
                     <div className="space-y-2">
                       <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                         <span className="text-muted-foreground">Dynamic Sitemap (auto-updates)</span>
                         <a href="https://www.kenyaadverts.com/sitemap-dynamic.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-[11px]">kenyaadverts.com/sitemap-dynamic.xml</a>
                       </div>
                       <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                         <span className="text-muted-foreground">Static Sitemap</span>
                         <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-[11px]">/sitemap.xml</a>
                       </div>
                       <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                         <span className="text-muted-foreground">Robots.txt</span>
                         <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono text-[11px]">/robots.txt</a>
                       </div>
                       <div className="flex items-center justify-between text-xs py-2">
                         <span className="text-muted-foreground">Boost Expiry Cron</span>
                         <span className="text-primary font-mono text-[11px]">Every hour (automatic)</span>
                       </div>
                     </div>
                   </div>

                   {/* Recent login activity */}
                   <div className="bg-card border border-border/60 rounded-xl p-4">
                     <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Recent Login Activity</h3>
                     <div className="space-y-1.5 max-h-60 overflow-y-auto">
                       {loginLogs.slice(0, 10).map(log => (
                         <div key={log.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/30 last:border-0">
                           <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${log.event_type === "login" ? "bg-primary" : log.event_type === "login_failed" ? "bg-destructive" : log.event_type === "signup" ? "bg-green-500" : "bg-muted-foreground"}`} />
                             <span className="text-foreground font-medium">{log.email || "Unknown"}</span>
                             <span className="text-muted-foreground">{log.event_type}</span>
                           </div>
                           <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                         </div>
                       ))}
                       {loginLogs.length === 0 && <p className="text-muted-foreground text-xs py-2">No login activity yet.</p>}
                     </div>
                   </div>
                 </div>
               )}

              {/* SEO */}
              {activeTab === "seo" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2 mb-3"><SearchIcon className="w-4 h-4" /> SEO Management</h2>
                  <AdminSEO />
                </div>
              )}

              {activeTab === "indexing" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <AdminIndexing />
                </div>
              )}

              {activeTab === "digital" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <AdminDigitalProducts />
                </div>
              )}




              {/* PAYMENTS */}
              {activeTab === "payments" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><CreditCard className="w-4 h-4" /> All Payments & Transactions</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <div className="bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{payments.length}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="bg-primary/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{payments.filter(p => p.payment_status === "completed").length}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                    <div className="bg-yellow-500/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{payments.filter(p => p.payment_status === "pending").length}</p>
                      <p className="text-[10px] text-muted-foreground">Pending</p>
                    </div>
                    <div className="bg-destructive/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-destructive">{payments.filter(p => p.payment_status === "failed").length}</p>
                      <p className="text-[10px] text-muted-foreground">Failed</p>
                    </div>
                  </div>
                  {pageLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No payments recorded yet.</p>
                  ) : (
                     <div className="space-y-2">
                       {payments.map(p => (
                         <div key={p.id} className="border border-border/40 rounded-xl p-3 space-y-1.5">
                           <div className="flex items-center justify-between">
                             <span className="font-semibold text-sm text-foreground">KSh {Number(p.amount).toLocaleString()}</span>
                             <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                               p.payment_status === "completed" ? "bg-primary/10 text-primary" :
                               p.payment_status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                               p.payment_status === "failed" ? "bg-destructive/10 text-destructive" :
                               "bg-muted text-muted-foreground"
                             }`}>{p.payment_status || "—"}</span>
                           </div>
                           <p className="text-xs text-muted-foreground">{p.profiles?.full_name || p.user_id?.slice(0, 8) || "—"} · {p.phone_number}</p>
                           <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                             <span>{p.package_type?.replace(/_/g, " ") || "—"}</span>
                             <span>{p.mpesa_code || "No code"}</span>
                           </div>
                           {(p.ads as any)?.title && <p className="text-[11px] text-muted-foreground truncate">Ad: {(p.ads as any).title}</p>}
                           <p className="text-[10px] text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</p>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              )}


              {activeTab === "reports" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><BadgeAlert className="w-4 h-4" /> Reported Ads</h2>
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
                              <p className="font-medium text-sm text-foreground truncate">{row.ads?.title || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{row.reason}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {row.ai_label && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getLabelColor(row.ai_label)}`}>{row.ai_label} {row.ai_confidence ? `(${Math.round(row.ai_confidence * 100)}%)` : ""}</span>}
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{row.status}</span>
                            </div>
                          </div>
                          {row.ai_summary && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">AI: {row.ai_summary}</p>}
                          <div className="flex flex-wrap gap-1.5">
                            {!row.ai_label && row.status === "pending" && (
                              <Button variant="outline" size="sm" onClick={() => handleAIModerate(row.id)} disabled={moderatingId === row.id} className="text-xs h-7">
                                {moderatingId === row.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bot className="w-3 h-3 mr-1" />} AI Review
                              </Button>
                            )}
                            {row.ads?.id && <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => navigate(getAdPath({ id: row.ads!.id, title: row.ads!.title }))}>Open</Button>}
                            {row.ads?.id && row.ads.status !== "pending" && <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleSetAdStatus(row.ads!.id, "pending")} disabled={saving}>Deactivate</Button>}
                            {row.ads?.id && row.ads.status === "pending" && <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleSetAdStatus(row.ads!.id, "active")} disabled={saving}>Reactivate</Button>}
                            <Button size="sm" className="text-xs h-7" onClick={() => handleResolveReport(row.id)} disabled={saving}>Resolve</Button>
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
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Users className="w-4 h-4" /> Platform Users ({users.length})</h2>
                  {pageLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div key={u.id} className="border border-border/60 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{u.full_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{u.phone || "No phone"}</p>
                            <p className="text-[10px] text-muted-foreground">Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {u.is_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Verified</span>}
                            <button onClick={() => { setCreditsUserId(u.id); setActiveTab("credits"); }} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80">Credits</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECURITY - IP Blocking */}
              {activeTab === "security" && (
                <div className="space-y-4">
                  <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                    <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Ban className="w-4 h-4" /> IP Blocking</h2>
                     <div className="space-y-2">
                       <Input value={newBlockIp} onChange={e => setNewBlockIp(e.target.value)} placeholder="IP address" className="h-10" />
                       <Input value={newBlockReason} onChange={e => setNewBlockReason(e.target.value)} placeholder="Reason (optional)" className="h-10" />
                       <Button size="sm" onClick={handleBlockIp} disabled={saving} className="h-10 w-full">Block IP</Button>
                     </div>
                    {ipBlocks.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No blocked IPs.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {ipBlocks.map(b => (
                          <div key={b.id} className="flex items-center justify-between border border-border/60 rounded-lg p-2.5 text-xs">
                            <div>
                              <span className="font-mono font-medium text-foreground">{b.ip_address}</span>
                              {b.reason && <span className="text-muted-foreground ml-2">— {b.reason}</span>}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive" onClick={() => handleUnblockIp(b.id)} disabled={saving}>Unblock</Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                    <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Security Status</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Rate Limiting</span>
                        <span className="text-primary font-medium">Active (5 attempts / 15 min)</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Email Verification</span>
                        <span className="text-primary font-medium">Required</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/30">
                        <span className="text-muted-foreground">Input Validation</span>
                        <span className="text-primary font-medium">Active</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/30">
                        <span className="text-muted-foreground">RLS Policies</span>
                        <span className="text-primary font-medium">All tables protected</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Failed Logins (24h)</span>
                        <span className={stats.failedLogins24h > 10 ? "text-destructive font-bold" : "text-foreground font-medium"}>{stats.failedLogins24h}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOGIN LOGS */}
              {activeTab === "login-logs" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Login Logs</h2>
                  {loginLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No login events logged yet.</p>
                  ) : (
                     <div className="space-y-2">
                       {loginLogs.map(log => (
                         <div key={log.id} className="border border-border/40 rounded-xl p-3 space-y-1">
                           <div className="flex items-center justify-between">
                             <span className="font-medium text-sm text-foreground truncate max-w-[60%]">{log.email || "—"}</span>
                             <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                               log.event_type === "login" ? "bg-primary/10 text-primary" :
                               log.event_type === "login_failed" ? "bg-destructive/10 text-destructive" :
                               log.event_type === "signup" ? "bg-primary/10 text-primary" :
                               "bg-muted text-muted-foreground"
                             }`}>
                               {log.event_type}
                             </span>
                           </div>
                           <p className="text-[10px] text-muted-foreground truncate">{log.user_agent?.slice(0, 60) || "—"}</p>
                           <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              )}

              {/* ALERTS */}
              {activeTab === "alerts" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Alert Requests</h2>
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

              {/* CATEGORIES */}
              {activeTab === "categories" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-3">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Category Suggestions</h2>
                  {catSuggestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No category suggestions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {catSuggestions.map((row) => (
                        <div key={row.id} className="border border-border/60 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground">{row.category_name}</p>
                              <p className="text-[10px] text-muted-foreground">User: {row.user_id.slice(0, 8)}...</p>
                              {row.note && <p className="text-xs text-muted-foreground mt-1">{row.note}</p>}
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{row.status}</span>
                          </div>
                          {row.status === "pending" && (
                            <div className="flex gap-1.5">
                              <Button size="sm" className="text-xs h-7" onClick={async () => {
                                setSaving(true);
                                await supabase.from("category_suggestions" as any).update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", row.id);
                                setSaving(false);
                                toast({ title: "Approved" });
                                await loadAdminData();
                              }} disabled={saving}>Approve</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
                                setSaving(true);
                                await supabase.from("category_suggestions" as any).update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() } as any).eq("id", row.id);
                                setSaving(false);
                                toast({ title: "Rejected" });
                                await loadAdminData();
                              }} disabled={saving}>Reject</Button>
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
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Wallet className="w-4 h-4" /> Credits Manager</h2>
                  <div className="space-y-2">
                    <Input value={creditsUserId} onChange={e => setCreditsUserId(e.target.value)} placeholder="User UUID" className="h-10" />
                    <Input value={creditsAmount} onChange={e => setCreditsAmount(e.target.value)} placeholder="New credit balance" type="number" className="h-10" />
                    <Button onClick={handleUpdateCredits} disabled={saving} className="w-full h-10">Update Credits</Button>
                  </div>
                </div>
              )}

              {/* PAGES */}
              {activeTab === "pages" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <AdminPageEditor />
                </div>
              )}

              {/* PRICING */}
              {activeTab === "pricing" && (
                <div className="space-y-4">
                  <AdminPaymentProvider />
                  <div className="bg-card border border-border/60 rounded-2xl p-4">
                    <h2 className="font-heading font-semibold text-base flex items-center gap-2 mb-3"><DollarSign className="w-4 h-4" /> Package Pricing</h2>
                    <AdminPricing />
                  </div>
                </div>
              )}

              {/* ADVERTISERS */}
              {activeTab === "advertisers" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2 mb-3"><Megaphone className="w-4 h-4" /> Advertiser Requests</h2>
                  {advRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-6 text-center">No advertiser requests yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {advRequests.map((req) => (
                        <div key={req.id} className="border border-border rounded-xl p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{req.business_name}</p>
                              <p className="text-xs text-muted-foreground">{req.contact_person} - {req.phone} - {req.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              req.status === "approved" ? "bg-primary/10 text-primary" :
                              req.status === "rejected" ? "bg-destructive/10 text-destructive" :
                              "bg-accent/20 text-accent-foreground"
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">Package: <strong>{req.preferred_package.replace(/_/g, " ")}</strong></p>
                          {req.message && <p className="text-xs text-muted-foreground mb-2">"{req.message}"</p>}
                          <p className="text-[10px] text-muted-foreground mb-3">{new Date(req.created_at).toLocaleString("en-KE")}</p>
                          {req.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" className="h-7 text-xs" onClick={async () => {
                                await supabase.from("advertiser_requests" as any).update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user!.id } as any).eq("id", req.id);
                                loadAdminData();
                                toast({ title: "Request approved" });
                              }}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={async () => {
                                await supabase.from("advertiser_requests" as any).update({ status: "rejected", reviewed_at: new Date().toISOString(), reviewed_by: user!.id } as any).eq("id", req.id);
                                loadAdminData();
                                toast({ title: "Request rejected" });
                              }}>Reject</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* CAMPAIGNS */}
              {activeTab === "campaigns" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Image className="w-4 h-4" /> Banner Campaigns</h2>
                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-6 text-center">No campaigns yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.map((c: any) => (
                        <div key={c.id} className="border border-border rounded-xl p-4 space-y-3">
                          {editingCampaign?.id === c.id ? (
                            <div className="space-y-2">
                              <Input value={editingCampaign.business_name} onChange={e => setEditingCampaign({ ...editingCampaign, business_name: e.target.value })} placeholder="Business Name" className="h-9 text-sm" />
                              <Input value={editingCampaign.target_url} onChange={e => setEditingCampaign({ ...editingCampaign, target_url: e.target.value })} placeholder="Target URL" className="h-9 text-sm" />
                              <select
                                value={editingCampaign.status}
                                onChange={e => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                              >
                                <option value="pending_payment">Pending Payment</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="expired">Expired</option>
                                <option value="payment_failed">Payment Failed</option>
                              </select>
                              <Input type="number" value={editingCampaign.amount_paid} onChange={e => setEditingCampaign({ ...editingCampaign, amount_paid: e.target.value })} placeholder="Amount Paid" className="h-9 text-sm" inputMode="numeric" />
                              <div className="flex gap-2">
                                <Button size="sm" className="h-8 text-xs" onClick={async () => {
                                  setSaving(true);
                                  await (supabase.from("banner_campaigns" as any) as any).update({
                                    business_name: editingCampaign.business_name,
                                    target_url: editingCampaign.target_url,
                                    status: editingCampaign.status,
                                    amount_paid: Number(editingCampaign.amount_paid),
                                    updated_at: new Date().toISOString(),
                                  }).eq("id", c.id);
                                  setSaving(false);
                                  setEditingCampaign(null);
                                  toast({ title: "Campaign updated" });
                                  loadAdminData();
                                }} disabled={saving}>Save</Button>
                                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingCampaign(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate">{c.business_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{c.target_url}</p>
                                </div>
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  c.status === "active" ? "bg-primary/10 text-primary" :
                                  c.status === "expired" ? "bg-muted text-muted-foreground" :
                                  c.status === "payment_failed" ? "bg-destructive/10 text-destructive" :
                                  "bg-accent/20 text-accent-foreground"
                                }`}>{c.status?.replace(/_/g, " ")}</span>
                              </div>
                              {c.banner_image && (
                                <img src={c.banner_image} alt="Banner" className="w-full h-20 object-cover rounded-lg border border-border" />
                              )}
                              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                                <span>Package: {c.package_type?.replace(/_/g, " ")}</span>
                                <span>Paid: KSh {c.amount_paid}</span>
                                <span>Impressions: {c.impressions || 0}</span>
                                <span>Clicks: {c.clicks || 0}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString("en-KE")}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingCampaign({ ...c })}>Edit</Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={async () => {
                                  if (!confirm("Delete this campaign?")) return;
                                  await (supabase.from("banner_campaigns" as any) as any).delete().eq("id", c.id);
                                  toast({ title: "Campaign deleted" });
                                  loadAdminData();
                                }}>
                                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STORAGE & CDN */}
              {activeTab === "storage" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><HardDrive className="w-4 h-4" /> Storage & CDN</h2>
                  <AdminStorageCDN />
                </div>
              )}

              {/* AI GENERATOR */}
              {activeTab === "ai-generator" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Wand2 className="w-4 h-4" /> AI Listing Generator</h2>
                  <AdminAIGenerator />
                </div>
              )}

              {/* PAYHERO SETTINGS */}
              {activeTab === "payhero" && (
                <div className="bg-card border border-border/60 rounded-2xl p-4 space-y-4">
                  <h2 className="font-heading font-semibold text-base flex items-center gap-2"><Settings className="w-4 h-4" /> PayHero Settings</h2>
                  <p className="text-sm text-muted-foreground">Update your PayHero API credentials securely. Leave a field empty to keep the current value.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">API Username</label>
                      <Input value={phUsername} onChange={e => setPhUsername(e.target.value)} placeholder="Current username (hidden)" className="h-10" autoComplete="off" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">API Password</label>
                      <Input type="password" value={phPassword} onChange={e => setPhPassword(e.target.value)} placeholder="Current password (hidden)" className="h-10" autoComplete="off" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Channel ID</label>
                      <Input value={phChannel} onChange={e => setPhChannel(e.target.value.replace(/\D/g, ""))} placeholder="Current channel (hidden)" className="h-10" inputMode="numeric" autoComplete="off" />
                    </div>
                    <Button className="w-full h-10" disabled={phSaving || (!phUsername && !phPassword && !phChannel)} onClick={async () => {
                      setPhSaving(true);
                      try {
                        const { data: result, error } = await supabase.functions.invoke("update-payhero-secrets", {
                          body: {
                            username: phUsername.trim() || undefined,
                            password: phPassword.trim() || undefined,
                            channel_id: phChannel.trim() || undefined,
                          },
                        });
                        if (error) throw error;
                        toast({ title: "PayHero config reference saved!", description: "To update the actual API secrets, use the backend secrets manager." });
                        setPhUsername("");
                        setPhPassword("");
                        setPhChannel("");
                      } catch {
                        toast({ title: "Failed to save", variant: "destructive" });
                      }
                      setPhSaving(false);
                    }}>
                      {phSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                      Save PayHero Settings
                    </Button>
                    <p className="text-[11px] text-muted-foreground/70">⚠️ These credentials are stored securely. Never share them with anyone.</p>
                  </div>
                </div>
              )}

              {/* BLOG GENERATOR */}
              {activeTab === "blog" && <AdminBlogGenerator />}

              {/* AI */}
              {activeTab === "ai" && <AdminAIChat />}

            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
