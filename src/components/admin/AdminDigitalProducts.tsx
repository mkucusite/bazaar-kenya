import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, ExternalLink, X, Image as ImageIcon, ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

const CATEGORIES = ["Software", "Operating Systems", "E-books", "Courses", "Templates", "Music", "Other"];

type DP = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  description: string | null;
  price: number | null;
  category: string | null;
  images: string[] | null;
  delivery_type: "link" | "file" | "email";
  delivery_content: string | null;
  access_mode: "public" | "restricted";
  allowed_emails: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  is_verified_seller: boolean;
  approval_status: "pending" | "approved" | "rejected";
  seller_name: string | null;
  seller_contact: string | null;
  created_by: string | null;
  created_at: string;
};

const empty: Partial<DP> = {
  title: "", slug: "", short_description: "", description: "", price: 0, category: "Software",
  images: [], delivery_type: "link", delivery_content: "", access_mode: "public",
  allowed_emails: [], seo_title: "", seo_description: "", is_published: true,
  is_verified_seller: true, approval_status: "approved", seller_name: "", seller_contact: "",
};

const statusMeta: Record<string, { icon: any; label: string; cls: string }> = {
  approved: { icon: CheckCircle2, label: "Approved", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  pending: { icon: Clock, label: "Pending review", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  rejected: { icon: XCircle, label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

const AdminDigitalProducts = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DP[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DP> | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("digital_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setItems((data || []) as DP[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("admin_dp_draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.title || parsed.description)) setEditing(parsed);
      }
    } catch {}
  }, []);

  // Autosave editing state to localStorage
  useEffect(() => {
    if (editing) {
      try { localStorage.setItem("admin_dp_draft", JSON.stringify(editing)); } catch {}
    } else {
      try { localStorage.removeItem("admin_dp_draft"); } catch {}
    }
  }, [editing]);

  const filtered = statusFilter === "all" ? items : items.filter((p) => p.approval_status === statusFilter);
  const pendingCount = items.filter((p) => p.approval_status === "pending").length;

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      title: editing.title.trim(),
      slug: (editing.slug?.trim() || slugify(editing.title)).slice(0, 80),
      short_description: editing.short_description || null,
      description: editing.description || null,
      price: Number(editing.price) || 0,
      category: editing.category || "Software",
      images: editing.images || [],
      delivery_type: editing.delivery_type || "link",
      delivery_content: editing.delivery_content || null,
      access_mode: editing.access_mode || "public",
      allowed_emails: editing.allowed_emails || [],
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      is_published: editing.is_published !== false,
      is_verified_seller: editing.is_verified_seller !== false,
      approval_status: editing.approval_status || "approved",
      seller_name: editing.seller_name || null,
      seller_contact: editing.seller_contact || null,
    };
    if (!editing.id) payload.created_by = user?.id ?? null;

    let error;
    if (editing.id) {
      ({ error } = await (supabase as any).from("digital_products").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await (supabase as any).from("digital_products").insert(payload));
    }
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: editing.id ? "Product updated" : "Product created" });
    setEditing(null);
    await load();
  };

  const quickAction = async (id: string, patch: Partial<DP>) => {
    const { error } = await (supabase as any).from("digital_products").update(patch).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated" });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this digital product?")) return;
    const { error } = await (supabase as any).from("digital_products").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    await load();
  };

  const addImage = () => {
    if (!imageInput.trim() || !editing) return;
    setEditing({ ...editing, images: [...(editing.images || []), imageInput.trim()] });
    setImageInput("");
  };
  const removeImage = (i: number) => editing && setEditing({ ...editing, images: (editing.images || []).filter((_, idx) => idx !== i) });
  const addEmail = () => {
    if (!emailInput.trim() || !editing) return;
    setEditing({ ...editing, allowed_emails: [...(editing.allowed_emails || []), emailInput.trim().toLowerCase()] });
    setEmailInput("");
  };
  const removeEmail = (i: number) => editing && setEditing({ ...editing, allowed_emails: (editing.allowed_emails || []).filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading font-semibold text-base flex items-center gap-2">
            Digital Store Products
            {pendingCount > 0 && <Badge variant="destructive" className="text-[10px]">{pendingCount} pending</Badge>}
          </h2>
          <p className="text-xs text-muted-foreground">Admin uploads are auto-verified & published. User submissions require approval.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...empty })} className="h-8">
          <Plus className="w-3.5 h-3.5 mr-1" /> New product
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border whitespace-nowrap capitalize ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
            {s} {s === "pending" && pendingCount > 0 ? `(${pendingCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No products in this view.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const sm = statusMeta[p.approval_status] || statusMeta.pending;
            const SIcon = sm.icon;
            return (
              <div key={p.id} className="border border-border/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-4 h-4" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                    {p.title}
                    {p.is_verified_seller && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.category} · {p.access_mode} · KSh {Number(p.price || 0).toLocaleString()} · /{p.slug}
                    {!p.is_published && " · HIDDEN"}
                  </p>
                  <span className={`mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${sm.cls}`}>
                    <SIcon className="w-2.5 h-2.5" /> {sm.label}
                  </span>
                </div>
                {p.approval_status === "pending" && (
                  <>
                    <button onClick={() => quickAction(p.id, { approval_status: "approved", is_published: true, is_verified_seller: true })}
                            className="text-emerald-600 hover:text-emerald-700 p-1.5" title="Approve">
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => quickAction(p.id, { approval_status: "rejected", is_published: false })}
                            className="text-destructive hover:text-destructive/80 p-1.5" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
                <a href={`/digital-store/${p.slug}`} target="_blank" rel="noopener noreferrer"
                   className="text-muted-foreground hover:text-primary p-1.5"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => setEditing(p)} className="text-muted-foreground hover:text-primary p-1.5">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-start md:items-center justify-center p-3 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl p-4 md:p-6 my-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base">{editing.id ? "Edit product" : "New product"}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Title *</label>
                <Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                       placeholder="e.g. Windows 11 Pro License Key" className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Slug (URL)</label>
                <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                       placeholder="auto from title" className="h-9 text-sm font-mono" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Category</label>
                <select value={editing.category || "Software"}
                        onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                        className="w-full h-9 text-sm bg-background border border-input rounded-md px-3">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Price (KSh) — 0 for free</label>
                <Input type="number" value={editing.price ?? 0}
                       onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                       className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Visibility</label>
                <select value={editing.is_published === false ? "no" : "yes"}
                        onChange={(e) => setEditing({ ...editing, is_published: e.target.value === "yes" })}
                        className="w-full h-9 text-sm bg-background border border-input rounded-md px-3">
                  <option value="yes">Visible</option>
                  <option value="no">Hidden</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Seller name (shown to buyers)</label>
                <Input value={editing.seller_name || ""} onChange={(e) => setEditing({ ...editing, seller_name: e.target.value })}
                       placeholder="KenyaAdvert Store" className="h-9 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Seller contact (WhatsApp/email — optional)</label>
                <Input value={editing.seller_contact || ""} onChange={(e) => setEditing({ ...editing, seller_contact: e.target.value })}
                       placeholder="0712345678 or sales@example.com" className="h-9 text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Short description (1 line)</label>
                <Input value={editing.short_description || ""}
                       onChange={(e) => setEditing({ ...editing, short_description: e.target.value })}
                       placeholder="Genuine lifetime license, instant delivery" className="h-9 text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Full description (Markdown allowed)</label>
                <Textarea value={editing.description || ""}
                          onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                          rows={5} className="text-sm" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Images (paste URLs — add 3 or more)</label>
                <div className="flex gap-2">
                  <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)}
                         placeholder="https://..." className="h-9 text-sm" />
                  <Button size="sm" onClick={addImage} className="h-9">Add</Button>
                </div>
                {(editing.images || []).length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {(editing.images || []).map((img, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(i)}
                                className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-0.5 rounded-bl">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground">Delivery type</label>
                <select value={editing.delivery_type || "link"}
                        onChange={(e) => setEditing({ ...editing, delivery_type: e.target.value as any })}
                        className="w-full h-9 text-sm bg-background border border-input rounded-md px-3">
                  <option value="link">Direct download/external link</option>
                  <option value="file">Uploaded file URL</option>
                  <option value="email">Send via email</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Approval status (admin)</label>
                <select value={editing.approval_status || "approved"}
                        onChange={(e) => setEditing({ ...editing, approval_status: e.target.value as any })}
                        className="w-full h-9 text-sm bg-background border border-input rounded-md px-3">
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">Delivery content (URL or instructions)</label>
                <Input value={editing.delivery_content || ""}
                       onChange={(e) => setEditing({ ...editing, delivery_content: e.target.value })}
                       placeholder="https://drive.google.com/... or license key text" className="h-9 text-sm font-mono" />
              </div>

              <div className="md:col-span-2 border-t border-border/60 pt-3">
                <label className="text-[11px] text-muted-foreground">Access</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={editing.access_mode !== "restricted"}
                           onChange={() => setEditing({ ...editing, access_mode: "public" })} />
                    All users
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={editing.access_mode === "restricted"}
                           onChange={() => setEditing({ ...editing, access_mode: "restricted" })} />
                    Specific emails only
                  </label>
                </div>
                {editing.access_mode === "restricted" && (
                  <div className="mt-2">
                    <div className="flex gap-2">
                      <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                             placeholder="user@example.com" className="h-9 text-sm" />
                      <Button size="sm" onClick={addEmail} className="h-9">Add</Button>
                    </div>
                    {(editing.allowed_emails || []).length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {(editing.allowed_emails || []).map((em, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-muted">
                            {em}
                            <button onClick={() => removeEmail(i)}><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex items-center gap-2 border-t border-border/60 pt-3">
                <input id="verified-toggle" type="checkbox" checked={editing.is_verified_seller !== false}
                       onChange={(e) => setEditing({ ...editing, is_verified_seller: e.target.checked })} />
                <label htmlFor="verified-toggle" className="text-sm text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified seller badge
                </label>
              </div>

              <div className="md:col-span-2 border-t border-border/60 pt-3">
                <label className="text-[11px] text-muted-foreground">SEO title (≤ 60 chars) — optional</label>
                <Input value={editing.seo_title || ""}
                       onChange={(e) => setEditing({ ...editing, seo_title: e.target.value.slice(0, 60) })}
                       className="h-9 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">SEO description (≤ 155 chars) — optional</label>
                <Textarea value={editing.seo_description || ""}
                          onChange={(e) => setEditing({ ...editing, seo_description: e.target.value.slice(0, 155) })}
                          rows={2} className="text-sm" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                {editing.id ? "Save changes" : "Create product"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDigitalProducts;
