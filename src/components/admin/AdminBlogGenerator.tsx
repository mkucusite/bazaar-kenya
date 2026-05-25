import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Save, Eye, EyeOff, Image as ImageIcon,
  FileText, ExternalLink, Trash2, Edit3, PlusCircle, UploadCloud
} from "lucide-react";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  author: string | null;
  image: string | null;
  read_time: string | null;
  is_published: boolean | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string | null;
};

const CATEGORIES = ["Politics", "Technology", "Property", "Vehicles", "Business", "Agriculture", "Fashion", "Safety", "Lifestyle"];

const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "A", "BLOCKQUOTE", "IMG"]);

const slugify = (value: string) => value
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/-+/g, "-")
  .slice(0, 90);

const plainTextToHtml = (text: string) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let list: { type: "ul" | "ol"; items: string[] } | null = null;
  const flushList = () => {
    if (!list) return;
    blocks.push(`<${list.type}>${list.items.map((item) => `<li>${inlineFormat(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushList(); continue; }
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((bullet || numbered)![1]);
      continue;
    }
    flushList();
    if (/^#{1,4}\s+/.test(line)) {
      const level = Math.min((line.match(/^#+/)?.[0].length || 2), 4);
      blocks.push(`<h${level}>${inlineFormat(line.replace(/^#{1,4}\s+/, ""))}</h${level}>`);
    } else if (line.length < 90 && /(:$|guide$|kenya$|2027$|campaign$)/i.test(line)) {
      blocks.push(`<h2>${inlineFormat(line.replace(/:$/, ""))}</h2>`);
    } else {
      blocks.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  flushList();
  return blocks.join("\n");
};

const inlineFormat = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/__(.+?)__/g, "<strong>$1</strong>")
  .replace(/\*(.+?)\*/g, "<em>$1</em>")
  .replace(/_(.+?)_/g, "<em>$1</em>");

const sanitizeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const cleanNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node as HTMLElement;
    if (!ALLOWED_TAGS.has(el.tagName)) {
      const fragment = document.createDocumentFragment();
      Array.from(el.childNodes).forEach((child) => {
        const clean = cleanNode(child);
        if (clean) fragment.appendChild(clean);
      });
      return fragment;
    }
    const out = document.createElement(el.tagName.toLowerCase());
    if (el.tagName === "A") {
      const href = el.getAttribute("href") || "";
      if (/^(https?:\/\/|\/)/i.test(href)) {
        out.setAttribute("href", href.replace(/^http:\/\/(www\.)?kenyaadverts\.com/i, "https://www.kenyaadverts.com").replace(/^https:\/\/kenyaadverts\.com/i, "https://www.kenyaadverts.com"));
        out.setAttribute("rel", "noopener noreferrer");
      }
    }
    if (el.tagName === "IMG") {
      const src = el.getAttribute("src") || "";
      if (/^(https?:\/\/|\/)/i.test(src)) out.setAttribute("src", src);
      const alt = el.getAttribute("alt") || "Blog image";
      out.setAttribute("alt", alt);
      out.setAttribute("loading", "lazy");
    }
    Array.from(el.childNodes).forEach((child) => {
      const clean = cleanNode(child);
      if (clean) out.appendChild(clean);
    });
    return out;
  };
  const container = document.createElement("div");
  Array.from(doc.body.firstElementChild?.childNodes || []).forEach((child) => {
    const clean = cleanNode(child);
    if (clean) container.appendChild(clean);
  });
  return container.innerHTML.trim();
};

const AdminBlogGenerator = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dirtySlug, setDirtySlug] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("Politics");
  const [author, setAuthor] = useState("KenyaAdvert Team");
  const [published, setPublished] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("blog_posts" as any)
      .select("id,title,slug,excerpt,content,category,author,image,read_time,is_published,meta_title,meta_description,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast({ title: "Could not load blog posts", description: error.message, variant: "destructive" });
    setPosts(((data || []) as any) as BlogPost[]);
    setLoadingPosts(false);
  };

  useEffect(() => { loadPosts(); }, []);

  useEffect(() => {
    if (!dirtySlug && title) setSlug(slugify(title));
    if (!metaTitle) setMetaTitle(title.slice(0, 60));
  }, [title, dirtySlug, metaTitle]);

  useEffect(() => {
    if (!metaDescription) setMetaDescription(excerpt.slice(0, 155));
  }, [excerpt, metaDescription]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) editorRef.current.innerHTML = content;
  }, [content, showPreview]);

  const resetForm = () => {
    setEditingId(null);
    setDirtySlug(false);
    setTitle("");
    setSlug("");
    setExcerpt("");
    setCategory("Politics");
    setAuthor("KenyaAdvert Team");
    setPublished(false);
    setMetaTitle("");
    setMetaDescription("");
    setImageUrl("");
    setContent("");
    setShowPreview(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const editPost = (post: BlogPost) => {
    setEditingId(post.id);
    setDirtySlug(true);
    setTitle(post.title || "");
    setSlug(post.slug || "");
    setExcerpt(post.excerpt || "");
    setCategory(post.category || "Politics");
    setAuthor(post.author || "KenyaAdvert Team");
    setPublished(!!post.is_published);
    setMetaTitle((post.meta_title || post.title || "").slice(0, 60));
    setMetaDescription((post.meta_description || post.excerpt || "").slice(0, 155));
    setImageUrl(post.image || "");
    setContent(post.content || "");
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData("text/html");
    const text = event.clipboardData.getData("text/plain");
    const incoming = html ? sanitizeHtml(html) : plainTextToHtml(text);
    document.execCommand("insertHTML", false, incoming);
    setContent(sanitizeHtml(editorRef.current?.innerHTML || ""));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from("blog-images").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(data.path);
      setImageUrl(publicUrl.publicUrl);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const savePost = async (publishNow: boolean) => {
    const finalContent = sanitizeHtml(content || editorRef.current?.innerHTML || "");
    if (!title.trim() || !slug.trim() || !finalContent) {
      toast({ title: "Title, slug, and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      slug: slugify(slug) || slug.trim(),
      excerpt: excerpt.trim() || null,
      content: finalContent,
      category: category.trim() || null,
      author: author.trim() || "KenyaAdvert Team",
      image: imageUrl.trim() || null,
      read_time: `${Math.max(2, Math.ceil(finalContent.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length / 220))} min`,
      is_published: publishNow,
      meta_title: (metaTitle || title).trim().slice(0, 60),
      meta_description: (metaDescription || excerpt).trim().slice(0, 155),
      updated_at: new Date().toISOString(),
    };

    const query = editingId
      ? supabase.from("blog_posts" as any).update(payload as any).eq("id", editingId)
      : supabase.from("blog_posts" as any).insert(payload as any);
    const { error } = await query;
    setSaving(false);
    if (error) {
      toast({ title: "Could not save post", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: publishNow ? "Blog post published" : "Draft saved" });
    await loadPosts();
    resetForm();
  };

  const deletePost = async (post: BlogPost) => {
    if (!window.confirm(`Delete blog post "${post.title}"?`)) return;
    const { error } = await supabase.from("blog_posts" as any).delete().eq("id", post.id);
    if (error) {
      toast({ title: "Could not delete post", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((item) => item.id !== post.id));
    if (editingId === post.id) resetForm();
    toast({ title: "Blog post deleted" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-base">Blog Editor</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={resetForm}>
          <PlusCircle className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Slug</label>
              <Input value={slug} onChange={(e) => { setDirtySlug(true); setSlug(e.target.value); }} className="font-mono text-sm" placeholder="article-slug" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Excerpt</label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} placeholder="Short public summary" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Author</label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <label className="text-xs font-medium text-foreground block">Published</label>
                <p className="text-[11px] text-muted-foreground">Visible publicly</p>
              </div>
              <Switch checked={published} onCheckedChange={setPublished} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Meta Title</label>
                <span className="text-[11px] text-muted-foreground">{metaTitle.length}/60</span>
              </div>
              <Input maxLength={60} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Auto-fills from title" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Meta Description</label>
                <span className="text-[11px] text-muted-foreground">{metaDescription.length}/155</span>
              </div>
              <Input maxLength={155} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Auto-fills from excerpt" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Cover Image
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              <Button type="button" variant="outline" className="relative" disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Upload
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} className="absolute inset-0 cursor-pointer opacity-0" />
              </Button>
            </div>
            {imageUrl && <img src={imageUrl} alt="Cover preview" className="mt-3 h-48 w-full rounded-lg border border-border/40 object-cover" />}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="text-xs font-medium text-foreground">Content</label>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showPreview ? "Edit" : "Preview"}
              </Button>
            </div>
            {showPreview ? (
              <div className="min-h-[320px] rounded-lg border border-border bg-background p-5 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                onInput={(e) => setContent(sanitizeHtml(e.currentTarget.innerHTML))}
                className="min-h-[360px] rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary"
              />
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => savePost(false)} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save as Draft
            </Button>
            <Button type="button" onClick={() => savePost(true)} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Publish
            </Button>
            {slug && <Button type="button" variant="outline" asChild><a href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-2" /> View</a></Button>}
          </div>
        </div>

        <aside className="rounded-xl border border-border/60 bg-card p-4">
          <h3 className="mb-3 font-heading text-sm font-semibold">Existing Posts</h3>
          {loadingPosts ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
              {posts.map((post) => (
                <div key={post.id} className="rounded-lg border border-border/50 bg-background p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">{post.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${post.is_published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {post.is_published ? "Live" : "Draft"}
                    </span>
                  </div>
                  <p className="mb-3 truncate text-[11px] text-muted-foreground">/blog/{post.slug}</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" className="h-8 flex-1 text-xs" onClick={() => editPost(post)}><Edit3 className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => deletePost(post)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No blog posts yet.</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default AdminBlogGenerator;
