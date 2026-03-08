import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeAlert, Loader2, ShieldCheck, ShieldX, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getAdPath } from "@/lib/ad-links";

type ReportRow = {
  id: string;
  ad_id: string;
  reason: string;
  status: string;
  ai_label: string | null;
  ai_summary: string | null;
  created_at: string;
  ads: {
    id: string;
    title: string;
    status: string | null;
  } | null;
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

const AdminPage = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loadingAdmin } = useAdmin();
  const navigate = useNavigate();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [alertRequests, setAlertRequests] = useState<AlertRequestRow[]>([]);
  const [stats, setStats] = useState({ totalAds: 0, activeAds: 0, pendingReports: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creditsUserId, setCreditsUserId] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const loadAdminData = useCallback(async () => {
    if (!user || !isAdmin) return;

    setPageLoading(true);
    const [reportsRes, requestsRes, adsRes] = await Promise.all([
      supabase
        .from("ad_reports")
        .select("id,ad_id,reason,status,ai_label,ai_summary,created_at,ads(id,title,status)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("alert_requests")
        .select("id,user_id,keyword,category,county,note,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("ads").select("id,status"),
    ]);

    if (reportsRes.error || requestsRes.error || adsRes.error) {
      toast({ title: "Failed to load admin data", variant: "destructive" });
      setPageLoading(false);
      return;
    }

    const ads = adsRes.data || [];
    setReports((reportsRes.data as ReportRow[]) || []);
    setAlertRequests((requestsRes.data as AlertRequestRow[]) || []);
    setStats({
      totalAds: ads.length,
      activeAds: ads.filter((ad) => ad.status === "active").length,
      pendingReports: (reportsRes.data || []).filter((row) => row.status === "pending" || row.status === "needs_review").length,
    });
    setPageLoading(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!loadingAdmin && isAdmin) {
      loadAdminData();
    }
  }, [loadingAdmin, isAdmin, loadAdminData]);

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
      ? await supabase
          .from("credits")
          .update({ balance: nextBalance, updated_at: new Date().toISOString() })
          .eq("user_id", creditsUserId.trim())
      : await supabase.from("credits").insert({ user_id: creditsUserId.trim(), balance: nextBalance });

    setSaving(false);

    if (error) {
      toast({ title: "Failed to update credits", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Credits updated" });
    setCreditsAmount("");
  };

  const pendingReports = useMemo(() => reports.filter((item) => item.status !== "resolved"), [reports]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-6 space-y-6">
        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-4">Admin Moderation</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Total Ads</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalAds}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Active Ads</p>
              <p className="text-2xl font-bold text-foreground">{stats.activeAds}</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Pending Reports</p>
              <p className="text-2xl font-bold text-foreground">{stats.pendingReports}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="font-heading font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Credits Manager
          </h2>
          <div className="grid md:grid-cols-3 gap-2">
            <Input value={creditsUserId} onChange={(e) => setCreditsUserId(e.target.value)} placeholder="User UUID" className="h-10" />
            <Input value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)} placeholder="New credit balance" type="number" className="h-10" />
            <Button onClick={handleUpdateCredits} disabled={saving} className="h-10">Update Credits</Button>
          </div>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="font-heading font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <BadgeAlert className="w-4 h-4" /> Reported Ads
          </h2>

          {pageLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : pendingReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending reports.</p>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((row) => (
                <div key={row.id} className="border border-border/60 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{row.ads?.title || "Unknown ad"}</p>
                      <p className="text-xs text-muted-foreground">{row.reason}</p>
                      {row.ai_summary && <p className="text-xs text-muted-foreground mt-1">AI: {row.ai_summary}</p>}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{row.status}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {row.ads?.id && (
                      <Button variant="outline" size="sm" onClick={() => navigate(getAdPath({ id: row.ads!.id, title: row.ads!.title }))}>
                        Open Ad
                      </Button>
                    )}
                    {row.ads?.id && row.ads.status !== "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleSetAdStatus(row.ads!.id, "pending")} disabled={saving}>
                        Deactivate
                      </Button>
                    )}
                    {row.ads?.id && row.ads.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleSetAdStatus(row.ads!.id, "active")} disabled={saving}>
                        Reactivate
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleResolveReport(row.id)} disabled={saving}>
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5">
          <h2 className="font-heading font-semibold text-base text-foreground mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Alert Requests
          </h2>

          {alertRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alert requests yet.</p>
          ) : (
            <div className="space-y-3">
              {alertRequests.map((row) => (
                <div key={row.id} className="border border-border/60 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">{row.keyword}</p>
                      <p className="text-xs text-muted-foreground">User: {row.user_id}</p>
                      <p className="text-xs text-muted-foreground">{[row.category, row.county].filter(Boolean).join(" • ") || "Any category • Any county"}</p>
                      {row.note && <p className="text-xs text-muted-foreground mt-1">{row.note}</p>}
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{row.status}</span>
                  </div>

                  {row.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAlertRequestStatus(row, "approved")} disabled={saving}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleAlertRequestStatus(row, "rejected")} disabled={saving}>Reject</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;
