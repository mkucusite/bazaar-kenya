import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  BarChart3,
  Eye,
  MousePointerClick,
  Calendar,
  ExternalLink,
  PlusCircle,
  Pencil,
  Check,
  X,
} from "lucide-react";

type Campaign = {
  id: string;
  package_type: string;
  banner_image: string;
  target_url: string;
  business_name: string;
  position: string;
  status: string;
  impressions: number;
  clicks: number;
  amount_paid: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  pending_payment: "bg-accent/20 text-accent-foreground",
  payment_failed: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  paused: "bg-muted text-muted-foreground",
};

const pkgNames: Record<string, string> = {
  basic_banner: "Basic Banner",
  featured_business: "Featured Business",
  category_sponsor: "Category Sponsor",
};

const MyCampaignsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banner_campaigns" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setCampaigns(((data || []) as any) as Campaign[]);
    setLoading(false);
  };

  const startEdit = (c: Campaign) => {
    setEditingId(c.id);
    setEditUrl(c.target_url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl("");
  };

  const saveUrl = async (id: string) => {
    if (!editUrl.trim()) {
      toast({ title: "URL cannot be empty", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("banner_campaigns" as any)
      .update({ target_url: editUrl.trim() } as any)
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update URL", variant: "destructive" });
      return;
    }
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, target_url: editUrl.trim() } : c));
    setEditingId(null);
    toast({ title: "Target URL updated!" });
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Please sign in to view your campaigns.</p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEOHead title="My Campaigns" description="View and manage your advertising campaigns on KenyaAdvert." />
      <Navbar />
      <main className="min-h-screen bg-background py-6 md:py-10">
        <div className="container-app max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-heading font-bold text-foreground">My Campaigns</h1>
            <Button onClick={() => navigate("/advertise")} className="gap-2">
              <PlusCircle className="w-4 h-4" /> New Campaign
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <BarChart3 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h2>
              <p className="text-sm text-muted-foreground mb-4">Create your first advertising campaign to reach thousands of buyers.</p>
              <Button onClick={() => navigate("/advertise")}>Create Campaign</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Banner preview */}
                  <div className="aspect-[4/1] bg-muted overflow-hidden">
                    <img src={c.banner_image} alt={c.business_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.business_name}</h3>
                        <p className="text-xs text-muted-foreground">{pkgNames[c.package_type] || c.package_type}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${statusStyles[c.status] || "bg-muted text-muted-foreground"}`}>
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Eye className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">{c.impressions.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Impressions</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <MousePointerClick className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-bold text-foreground">{c.clicks.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Clicks</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs font-medium text-foreground mt-1">
                          {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "N/A"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Expires</p>
                      </div>
                    </div>

                    {/* Target URL with inline edit */}
                    {editingId === c.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          placeholder="https://yourbusiness.co.ke"
                          className="h-8 text-xs flex-1"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveUrl(c.id)} disabled={saving}>
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-primary" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancelEdit}>
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <a
                          href={c.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline truncate flex-1"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          {c.target_url}
                        </a>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                          title="Edit target URL"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Dates */}
                    {c.starts_at && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Running: {new Date(c.starts_at).toLocaleDateString("en-KE")} — {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-KE") : "Ongoing"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MyCampaignsPage;