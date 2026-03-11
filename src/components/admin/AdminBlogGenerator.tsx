import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Sparkles, Save, Eye, EyeOff, Image as ImageIcon,
  FileText, Wand2, RotateCcw, ExternalLink
} from "lucide-react";

type GeneratedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
};

const CATEGORIES = ["Technology", "Property", "Vehicles", "Business", "Agriculture", "Fashion", "Safety", "Lifestyle"];

const AdminBlogGenerator = () => {
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoGenerateImage, setAutoGenerateImage] = useState(true);

  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReadTime, setEditReadTime] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Enter a topic or title", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setArticle(null);
    setShowPreview(false);

    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-article", {
        body: { 
          topic: topic.trim(), 
          draft: draft.trim() || undefined, 
          category: category || undefined,
          generateImage: autoGenerateImage,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const art = data.article as GeneratedArticle;
      setArticle(art);
      setEditTitle(art.title);
      setEditSlug(art.slug);
      setEditExcerpt(art.excerpt);
      setEditContent(art.content);
      setEditCategory(art.category);
      setEditReadTime(art.read_time);
      setShowPreview(true);

      // Use AI-generated image if available and no manual URL set
      if (data.generatedImageUrl && !imageUrl.trim()) {
        setImageUrl(data.generatedImageUrl);
      }

      toast({ title: "Article generated!", description: `"${art.title}" — review and publish below.` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!editTitle || !editSlug || !editContent) {
      toast({ title: "Title, slug, and content are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("blog_posts" as any).insert({
        title: editTitle,
        slug: editSlug,
        excerpt: editExcerpt,
        content: editContent,
        category: editCategory,
        read_time: editReadTime,
        image: imageUrl.trim() || null,
        author: "KenyaAdvert Team",
        is_published: true,
      } as any);

      if (error) throw error;
      toast({ title: "Article published!", description: `"${editTitle}" is now live on the blog.` });
      setTopic(""); setDraft(""); setImageUrl(""); setCategory("");
      setArticle(null); setShowPreview(false);
    } catch (err: any) {
      toast({ title: "Publish failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="font-heading font-semibold text-base">AI Blog Generator</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-4">
        Enter a topic or paste your draft — AI will produce a full article with a cover image in the KenyaAdvert blog format.
      </p>

      {/* Input Section */}
      <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Topic / Title *</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Best smartphones under KSh 15,000 in Kenya 2026"
            className="h-10"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            Draft / Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste your rough article, bullet points, or notes here..."
            rows={6}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
              Cover Image URL <span className="text-muted-foreground font-normal">(optional — AI will auto-generate)</span>
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Leave empty for AI-generated image"
              className="h-10"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">Auto-detect</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoGenImage"
            checked={autoGenerateImage}
            onChange={(e) => setAutoGenerateImage(e.target.checked)}
            className="rounded border-input"
          />
          <label htmlFor="autoGenImage" className="text-xs text-foreground">Auto-generate cover image with AI</label>
        </div>

        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border/40 max-h-48">
            <img src={imageUrl} alt="Cover preview" className="w-full h-48 object-cover" />
          </div>
        )}

        <Button onClick={handleGenerate} disabled={generating || !topic.trim()} className="w-full h-11">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating article & image...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Article with AI
            </>
          )}
        </Button>
      </div>

      {/* Generated Article */}
      {article && (
        <div className="space-y-4">
          <div className="bg-card border border-border/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Generated Article
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
                  {showPreview ? "Edit HTML" : "Preview"}
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleGenerate} disabled={generating}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Title</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Slug</label>
                <Input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className="h-9 text-sm font-mono" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Excerpt (Meta Description)</label>
              <Input value={editExcerpt} onChange={(e) => setEditExcerpt(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Read Time</label>
                <Input value={editReadTime} onChange={(e) => setEditReadTime(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {showPreview ? (
              <div className="border border-border/40 rounded-lg p-5 bg-background">
                {imageUrl && (
                  <img src={imageUrl} alt={editTitle} className="w-full h-56 object-cover rounded-lg mb-4" />
                )}
                <h1 className="text-2xl font-bold text-foreground mb-3">{editTitle}</h1>
                <p className="text-sm text-muted-foreground mb-4">
                  By KenyaAdvert Team • {editReadTime} read • {editCategory}
                </p>
                <div
                  className="prose prose-sm max-w-none text-foreground
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2
                    [&_p]:mb-3 [&_p]:leading-relaxed
                    [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
                    [&_li]:mb-1.5
                    [&_a]:text-primary [&_a]:underline
                    [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: editContent }}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Content (HTML) — <span className="text-muted-foreground font-normal">{editContent.length.toLocaleString()} characters</span>
                </label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePublish} disabled={saving} className="flex-1 h-11">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Publish Article</>
              )}
            </Button>
            {editSlug && (
              <Button variant="outline" className="h-11" asChild>
                <a href={`/blog/${editSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Preview Link
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogGenerator;
