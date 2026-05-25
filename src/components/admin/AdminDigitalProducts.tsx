import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, ExternalLink, X, Image as ImageIcon } from "lucide-react";

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
  file_url: string | null;
  external_link: string | null;
  access_type: "public" | "restricted";
  allowed_emails: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  created_at: string;
};

const empty: Partial<DP> = {
  title: "", slug: "", short_description: "", description: "", price: 0, category: "Software",
  images: [], file_url: "", external_link: "", access_type: "public",
  allowed_emails: [], seo_title: "", seo_description: "", is_active: true,
};

const AdminDigitalProducts = () => {
  const [items, setItems] = useState<DP[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<DP> | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

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
      file_url: editing.file_url || null,
      external_link: editing.external_link || null,
      access_type: editing.access_type || "public",
      allowed_emails: editing.allowed_emails || [],
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      is_active: editing.is_active !== false,
    };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this digital product?")) return;
    const { error } = await (supabase as any).from("digital_products").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    await load();
  };

  const addImage = () => {
    if (!imageInput.trim() || !editing) return;
    const next = [...(editing.images || []), imageInput.trim()];
    setEditing({ ...editing, images: next });
    setImageInput("");
  };

  const removeImage = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, images: (editing.images || []).filter((_, idx) => idx !== i) });
  };

  const addEmail = () => {
    if (!emailInput.trim() || !editing) return;
    const next = [...(editing.allowed_emails || []), emailInput.trim().toLowerCase()];
    setEditing({ ...editing, allowed_emails: next });
    setEmailInput("");
  };

  const removeEmail = (i: number) => {
    if (!editing) return;
    setEditing({ ...editing, allowed_emails: (editing.allowed_emails || []).filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-base">Digital Store Products</h2>
          <p className="text-xs text-muted-foreground">Software, e-books, courses & downloadable products.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...empty })} className="h-8">
          <Plus className="w-3.5 h-3.5 mr-1" /> New product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No digital products yet. Click "New product".</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div key={p.id} className="border border-border/60 rounded-xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-4 h-4" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.category} · {p.access_type} · KSh {Number(p.price || 0).toLocaleString()} · /{p.slug}
                  {!p.is_active && " · INACTIVE"}
                </p>
              </div>
              <a href={`/digital-store/${p.slug}`} target="_blank" rel="noopener noreferrer"
                 className="text-muted-foreground hover:text-primary p-1.5"><ExternalLink className="w-4 h-4" /></a>
              <button onClick={() => setEditing(p)} className="text-muted-foreground hover:text-primary p-1.5">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
                <label className="text-[11px] text-muted-foreground">Active</label>
                <select value={editing.is_active === false ? "no" : "yes"}
                        onChange={(e) => setEditing({ ...editing, is_active: e.target.value === "yes" })}
                        className="w-full h-9 text-sm bg-background border border-input rounded-md px-3">
                  <option value="yes">Visible</option>
                  <option value="no">Hidden</option>
                </select>
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

              {/* Images */}
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

              {/* Delivery */}
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">File URL (uploaded file) — optional</label>
                <Input value={editing.file_url || ""}
                       onChange={(e) => setEditing({ ...editing, file_url: e.target.value })}
                       placeholder="https://cdn... or storage link" className="h-9 text-sm font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-muted-foreground">External link (alternative to file) — optional</label>
                <Input value={editing.external_link || ""}
                       onChange={(e) => setEditing({ ...editing, external_link: e.target.value })}
                       placeholder="https://drive.google.com/..." className="h-9 text-sm font-mono" />
              </div>

              {/* Access control */}
              <div className="md:col-span-2 border-t border-border/60 pt-3">
                <label className="text-[11px] text-muted-foreground">Access</label>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={editing.access_type !== "restricted"}
                           onChange={() => setEditing({ ...editing, access_type: "public" })} />
                    All users
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" checked={editing.access_type === "restricted"}
                           onChange={() => setEditing({ ...editing, access_type: "restricted" })} />
                    Specific emails only
                  </label>
                </div>
                {editing.access_type === "restricted" && (
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

              {/* SEO */}
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
