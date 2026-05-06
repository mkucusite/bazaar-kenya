import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  BarChart3,
  Eye,
  MousePointerClick,
  Calendar,
  ExternalLink,
  PlusCircle,
  PenLine,
  Trash2,
} from "lucide-react";

type Campaign = {
  id: string;
  package_type: string;
  banner_image: string;
  target_url: string;
  business_name: string;
  description?: string | null;
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

const positionNames: Record<string, string> = {
  homepage_top: "Homepage Top",
  search_results: "Search Results",
  category_top: "Category Top",
};

const MyCampaignsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [editPosition, setEditPosition] = useState("homepage_top");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCampaigns();
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("banner_campaigns" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Could not load campaigns", description: error.message, variant: "destructive" });
      setCampaigns([]);
    } else {
      setCampaigns(((data || []) as any) as Campaign[]);
    }

    setLoading(false);
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditBusinessName(campaign.business_name || "");
    setEditTargetUrl(campaign.target_url || "");
    setEditPosition(campaign.position || "homepage_top");
    setEditDescription(campaign.description || "");
    setEditImageFile(null);
    setEditImagePreview(campaign.banner_image || null);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!user || !editingCampaign) return;

    const businessName = editBusinessName.trim();
    const targetUrl = editTargetUrl.trim();

    if (!businessName) {
      toast({ title: "Business name is required", variant: "destructive" });
      return;
    }

    if (targetUrl) {
      try { new URL(targetUrl); } catch {
        toast({ title: "Please enter a valid URL", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    let bannerImage = editingCampaign.banner_image;
    try {
      if (editImageFile) {
        const ext = editImageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("banners").upload(path, editImageFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("banners").getPublicUrl(path);
        bannerImage = pub.publicUrl;
      }
    } catch (err) {
      setSaving(false);
      toast({ title: "Could not upload image", description: err instanceof Error ? err.message : "", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("banner_campaigns" as any)
      .update({
        business_name: businessName,
        target_url: targetUrl || `https://www.kenyaadverts.com/banners`,
        position: editPosition,
        description: editDescription.trim() || null,
        banner_image: bannerImage,
      } as any)
      .eq("id", editingCampaign.id)
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Could not update campaign", description: error.message, variant: "destructive" });
      return;
    }

    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === editingCampaign.id
          ? {
              ...campaign,
              business_name: businessName,
              target_url: targetUrl,
              position: editPosition,
              description: editDescription.trim() || null,
              banner_image: bannerImage,
            }
          : campaign,
      ),
    );

    setIsEditOpen(false);
    setEditingCampaign(null);
    toast({ title: "Campaign updated" });
  };

  const handleDeleteCampaign = async (campaign: Campaign) => {
    if (!user) return;

    const confirmed = window.confirm(`Delete campaign \"${campaign.business_name}\"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(campaign.id);

    const { error } = await supabase
      .from("banner_campaigns" as any)
      .delete()
      .eq("id", campaign.id)
      .eq("user_id", user.id);

    setDeletingId(null);

    if (error) {
      toast({ title: "Could not delete campaign", description: error.message, variant: "destructive" });
      return;
    }

    setCampaigns((prev) => prev.filter((item) => item.id !== campaign.id));
    toast({ title: "Campaign deleted" });
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
                  <div className="aspect-[4/1] bg-muted overflow-hidden">
                    <img src={c.banner_image} alt={c.business_name} className="w-full h-full object-cover" width={1200} height={300} loading="lazy" decoding="async" />
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

                    <a
                      href={c.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {c.target_url}
                    </a>

                    {c.starts_at && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Running: {new Date(c.starts_at).toLocaleDateString("en-KE")} — {c.ends_at ? new Date(c.ends_at).toLocaleDateString("en-KE") : "Ongoing"}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Placement: {positionNames[c.position] || c.position}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => openEditDialog(c)}>
                          <PenLine className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => handleDeleteCampaign(c)}
                          disabled={deletingId === c.id}
                        >
                          {deletingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update your campaign details and save changes.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-business-name">Business name</Label>
              <Input
                id="campaign-business-name"
                value={editBusinessName}
                onChange={(e) => setEditBusinessName(e.target.value)}
                placeholder="Your business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-target-url">Target URL</Label>
              <Input
                id="campaign-target-url"
                value={editTargetUrl}
                onChange={(e) => setEditTargetUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-position">Placement</Label>
              <select
                id="campaign-position"
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
              >
                <option value="homepage_top">Homepage Top</option>
                <option value="search_results">Search Results</option>
                <option value="category_top">Category Top</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  );
};

export default MyCampaignsPage;
